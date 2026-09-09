namespace DooDuckInn.src.users;

public record CreateUserRequest(string CognitoSub);
public record UpdateEmailRequest(string Email);
