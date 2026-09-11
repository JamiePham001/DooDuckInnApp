using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using DooDuckInn.src.db;
using Microsoft.EntityFrameworkCore;
using DooDuckInn.src.transactions;

namespace DooDuckInn.src.taxes;

public class ReportDataSource(AppDbContext db)
{
    public async Task<Tax?> TaxDetails(int taxId)
    {
        var taxData = await db.Taxes.FirstOrDefaultAsync(t => t.Id == taxId);
        return taxData is null ? null : taxData;
    }

    public async Task<List<Transaction>> TransactionData(int taxId)
    {
        var transactionData = await db.Transactions.Where(t => t.TaxId == taxId).ToListAsync();
        return transactionData;
    }
}

public class TaxReportDocument : IDocument
{
    public Tax TaxInfo { get; }
    public Transaction[] TransactionInfo { get; }

    public TaxReportDocument(Tax tax, Transaction[] transaction)
    {
        TaxInfo = tax;
        TransactionInfo = transaction;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;
    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        var sales = TransactionInfo.Where(t => t.Type == TransactionType.Sale).ToList();
        var purchases = TransactionInfo.Where(t => t.Type == TransactionType.Purchase).ToList();

        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

            page.Header().Column(column =>
            {
                column.Item().Text("Doo Duck Inn").FontSize(22).Bold().FontColor(Colors.Blue.Darken3);
                column.Item().PaddingTop(2).Text($"GST Report — {FormatPeriod(TaxInfo.StartDate, TaxInfo.EndDate)}")
                    .FontSize(12).FontColor(Colors.Grey.Darken1);
                column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
            });

            page.Content().PaddingTop(20).Column(column =>
            {
                column.Spacing(25);
                column.Item().Component(new TransactionTable("Sales", sales));
                column.Item().Component(new TransactionTable("Purchases", purchases));
            });

            page.Footer().AlignCenter().Text(x =>
            {
                x.Span("Page ");
                x.CurrentPageNumber();
                x.Span(" of ");
                x.TotalPages();
            });
        });
    }

    private static string FormatPeriod(DateOnly start, DateOnly end)
    {
        var startMonth = start.ToString("MMMM", CultureInfo.InvariantCulture);
        var endMonth = end.ToString("MMMM yyyy", CultureInfo.InvariantCulture);
        return $"{startMonth} – {endMonth}";
    }
}

file class TransactionTable(string title, IReadOnlyList<Transaction> rows) : IComponent
{
    public void Compose(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Text(title).Bold().FontSize(13).FontColor(Colors.Blue.Darken3);

            column.Item().PaddingTop(6).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderCellStyle).Text("Description");
                    header.Cell().Element(HeaderCellStyle).AlignRight().Text("Amount");
                    header.Cell().Element(HeaderCellStyle).AlignRight().Text("GST");
                });

                if (rows.Count == 0)
                {
                    table.Cell().ColumnSpan(3).Element(BodyCellStyle)
                        .Text("No transactions recorded").Italic().FontColor(Colors.Grey.Medium);
                }

                foreach (var row in rows)
                {
                    table.Cell().Element(BodyCellStyle).Text(row.Name);
                    table.Cell().Element(BodyCellStyle).AlignRight().Text(row.Amount.ToString("N2"));
                    table.Cell().Element(BodyCellStyle).AlignRight().Text(row.Gst.ToString("N2"));
                }

                var totalAmount = rows.Sum(r => r.Amount);
                var totalGst = rows.Sum(r => r.Gst);

                table.Cell().Element(TotalCellStyle).Text("Total");
                table.Cell().Element(TotalCellStyle).AlignRight().Text(totalAmount.ToString("N2"));
                table.Cell().Element(TotalCellStyle).AlignRight().Text(totalGst.ToString("N2"));
            });
        });
    }

    private static IContainer HeaderCellStyle(IContainer c) =>
        c.Background(Colors.Grey.Lighten2).PaddingVertical(5).PaddingHorizontal(6)
            .DefaultTextStyle(x => x.Bold());

    private static IContainer BodyCellStyle(IContainer c) =>
        c.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(6);

    private static IContainer TotalCellStyle(IContainer c) =>
        c.BorderTop(1).BorderColor(Colors.Grey.Darken1).PaddingVertical(5).PaddingHorizontal(6)
            .DefaultTextStyle(x => x.Bold());
}
