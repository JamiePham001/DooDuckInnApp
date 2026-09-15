using DooDuckInn.src.taxes;
using DooDuckInn.src.transactions;
using QuestPDF.Fluent;

namespace DooDuckInn.Tests;

public class TaxReportDocumentTests
{
    private static readonly byte[] PdfMagicBytes = "%PDF"u8.ToArray();

    private static Tax NewTax() => new(1, new DateOnly(2026, 7, 1), new DateOnly(2026, 9, 30));

    private static void AssertValidPdf(byte[] pdf)
    {
        Assert.NotEmpty(pdf);
        Assert.Equal(PdfMagicBytes, pdf[..4]);
    }

    [Fact]
    public void GeneratePdf_Succeeds_WithSalesAndPurchases()
    {
        var tax = NewTax();
        Transaction[] transactions =
        [
            new(tax.Id, "Stock", 28000.00, 310.00, TransactionType.Sale),
            new(tax.Id, "Till", 35315.10, 3046.00, TransactionType.Sale),
            new(tax.Id, "Western Power", 4954.33, 450.40, TransactionType.Purchase),
        ];

        var pdf = new TaxReportDocument(tax, transactions).GeneratePdf();

        AssertValidPdf(pdf);
    }

    [Fact]
    public void GeneratePdf_Succeeds_WithNoTransactions()
    {
        var tax = NewTax();

        var pdf = new TaxReportDocument(tax, []).GeneratePdf();

        AssertValidPdf(pdf);
    }

    [Fact]
    public void GeneratePdf_Succeeds_WithOnlySales()
    {
        var tax = NewTax();
        Transaction[] transactions = [new(tax.Id, "Stock", 100.00, 10.00, TransactionType.Sale)];

        var pdf = new TaxReportDocument(tax, transactions).GeneratePdf();

        AssertValidPdf(pdf);
    }

    [Fact]
    public void GeneratePdf_Succeeds_WithOnlyPurchases()
    {
        var tax = NewTax();
        Transaction[] transactions = [new(tax.Id, "Western Power", 100.00, 10.00, TransactionType.Purchase)];

        var pdf = new TaxReportDocument(tax, transactions).GeneratePdf();

        AssertValidPdf(pdf);
    }

    [Fact]
    public void GeneratePdf_Succeeds_WithZeroGst()
    {
        var tax = NewTax();
        Transaction[] transactions = [new(tax.Id, "Shop Rent", 5619.00, 0.00, TransactionType.Purchase)];

        var pdf = new TaxReportDocument(tax, transactions).GeneratePdf();

        AssertValidPdf(pdf);
    }

    [Fact]
    public void GeneratePdf_Succeeds_WithLargeTransactionCount()
    {
        var tax = NewTax();
        var transactions = Enumerable.Range(1, 200)
            .Select(i => new Transaction(tax.Id, $"Line item {i}", i * 1.5, i * 0.15,
                i % 2 == 0 ? TransactionType.Sale : TransactionType.Purchase))
            .ToArray();

        var pdf = new TaxReportDocument(tax, transactions).GeneratePdf();

        AssertValidPdf(pdf);
    }

    [Fact]
    public void GeneratePdf_Succeeds_WithLongTransactionName()
    {
        var tax = NewTax();
        var longName = new string('A', 300);
        Transaction[] transactions = [new(tax.Id, longName, 10.00, 1.00, TransactionType.Sale)];

        var pdf = new TaxReportDocument(tax, transactions).GeneratePdf();

        AssertValidPdf(pdf);
    }
}
