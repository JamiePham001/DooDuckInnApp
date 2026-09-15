using System.Runtime.CompilerServices;
using QuestPDF.Infrastructure;

namespace DooDuckInn.Tests;

internal static class QuestPdfTestSetup
{
    // Runs once when the test assembly loads — QuestPDF throws on GeneratePdf() otherwise.
    [ModuleInitializer]
    public static void SetLicense()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }
}
