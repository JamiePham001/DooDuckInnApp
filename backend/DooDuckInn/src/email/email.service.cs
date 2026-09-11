using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace DooDuckInn.src.email;

public record EmailAttachment(string FileName, byte[] Content, string ContentType);

// Thin wrapper over SES's SMTP interface. Scenario-specific subject/body text (order emails,
// tax report emails) is composed by the caller — this only knows how to deliver a message.
public class EmailService(IConfiguration config)
{
    private string RequireConfig(string key) =>
        config[key] ?? throw new InvalidOperationException($"Missing configuration value '{key}'.");

    // textBody is always sent as the plain-text fallback for clients that don't render HTML;
    // pass htmlBody too for a styled version — most mail clients will prefer it when present.
    public async Task SendAsync(string toAddress, string subject, string textBody,
        EmailAttachment? attachment = null, string? htmlBody = null)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(RequireConfig("Ses:FromAddress")));
        message.To.Add(MailboxAddress.Parse(toAddress));
        message.Subject = subject;

        var builder = new BodyBuilder { TextBody = textBody, HtmlBody = htmlBody };
        if (attachment is not null)
        {
            builder.Attachments.Add(attachment.FileName, attachment.Content,
                ContentType.Parse(attachment.ContentType));
        }
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(RequireConfig("Ses:SmtpHost"), int.Parse(config["Ses:SmtpPort"] ?? "587"),
            SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(RequireConfig("Ses:SmtpUsername"), RequireConfig("Ses:SmtpPassword"));
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
