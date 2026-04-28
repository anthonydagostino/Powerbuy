# Use stable .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy ONLY the API project file to restore dependencies
COPY ["Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/"]

# 2. Restore dependencies for the API
RUN dotnet restore "Powerbuy.Api/Powerbuy.Api.csproj"

# 3. Copy the rest of the application's code
COPY . .

# 4. Publish the application
RUN dotnet publish "Powerbuy.Api/Powerbuy.Api.csproj" -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render usually assigns a PORT env var; 8080 is a safe default
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]
