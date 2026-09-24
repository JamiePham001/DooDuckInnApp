using DooDuckInn.src.items;

namespace DooDuckInn.src.suppliers;

public static class OrderEmail
{
  // ponytail: hardcoded — swap for real contact details, or pull from config, when they're settled.
  private const string ContactLine = "Questions about this order? Call: 04 1234 5678";

  public static string BuildText(DateOnly deliveryDate, IReadOnlyList<Item> items)
  {
    var lines = new List<string>
        {
            $"Requested delivery date: {deliveryDate:dddd, d MMMM yyyy}",
            ""
        };

    foreach (var item in items)
    {
      lines.Add($"  {item.Quantity ?? 0} x {item.Name}");
    }

    lines.Add("");
    lines.Add("Thank you,");
    lines.Add("Doo Duck Inn");
    lines.Add(ContactLine);

    return string.Join('\n', lines);
  }

  public static string BuildHtml(DateOnly deliveryDate, IReadOnlyList<Item> items)
  {
    var rows = string.Join("", items.Select(i => $"""
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">{i.Name}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;">{i.Quantity ?? 0}</td>
            </tr>
            """));

    return $"""
            <div style="font-family:'Segoe UI',Arial,sans-serif;color:#333333;max-width:480px;">
              <h2 style="color:#1f4e79;margin-bottom:4px;">Doo Duck Inn</h2>
              <p style="margin-top:0;color:#666666;">Delivery Order</p>
              <p><strong>Requested delivery date:</strong> {deliveryDate:dddd, d MMMM yyyy}</p>
              <table style="border-collapse:collapse;width:100%;margin-top:12px;">
                <thead>
                  <tr style="background:#f2f2f2;">
                    <th style="padding:8px 12px;text-align:left;">Item</th>
                    <th style="padding:8px 12px;text-align:right;">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows}
                </tbody>
              </table>
              <p style="margin-top:24px;">Thank you,<br/>Doo Duck Inn</p>
              <p style="color:#666666;font-size:12px;">{ContactLine}</p>
            </div>
            """;
  }
}
