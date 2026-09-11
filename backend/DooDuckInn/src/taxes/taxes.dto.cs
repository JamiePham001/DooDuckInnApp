namespace DooDuckInn.src.taxes;

public record TaxRequest(DateOnly dateStart, DateOnly dateEnd);
public record SendReportRequest(string RecipientEmail);
// public record DateRequest(DateOnly dateStart, DateOnly dateEnd);
