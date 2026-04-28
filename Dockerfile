# Use .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy the entire repository
COPY . .

# 2. Navigate to the project folder (Exactly as it appears on GitHub)
WORKDIR "/src/Powerbuy.Api/Powerbuy.Api"

# 3. Build and Publish using the local file name
RUN dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render requirements
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]