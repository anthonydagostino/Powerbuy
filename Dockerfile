# Use stable .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything
COPY . .

# 2. Run publish directly on the specific file path
# This combines restore and publish into one step to avoid path confusion
RUN dotnet publish "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]