using static System.Runtime.InteropServices.JavaScript.JSType;
namespace DooDuckInn.src.suppliers;

public record SupplierRequest(string name, string email, string phone);

public record SendOrderRequest(string RecipientEmail, DateOnly date);
