using MailKit.Net.Smtp;
using MailKit.Security;
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
        message.Cc.Add(MailboxAddress.Parse("hoangkaraoke888@gmail.com"));
        if (toAddress == "admin2@gordondu-associates.com.au")
        {
            message.Cc.Add(MailboxAddress.Parse("jamie.pham@outlook.com"));
        }

        var builder = new BodyBuilder { TextBody = textBody, HtmlBody = htmlBody };
        if (attachment is not null)
        {
            builder.Attachments.Add(attachment.FileName, attachment.Content,
                ContentType.Parse(attachment.ContentType));
        }
        message.Body = builder.ToMessageBody();

        var port = int.Parse(config["Ses:SmtpPort"] ?? "587");
        // Port 465 is implicit TLS (SmtpsOnConnect); 587/25 negotiate TLS via STARTTLS instead.
        var security = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

        using var client = new SmtpClient();
        await client.ConnectAsync(RequireConfig("Ses:SmtpHost"), port, security);
        await client.AuthenticateAsync(RequireConfig("Ses:SmtpUsername"), RequireConfig("Ses:SmtpPassword"));
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
