# Use stable .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything from the Render build context
COPY . .

# 2. Automatically find the .csproj file and publish it. 
# This bypasses any strict folder naming or casing issues!
RUN find . -name "*.csproj" -exec dotnet publish {} -c Release -o /app/publish \;

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# NOTE: Make sure the casing here matches your project name exactly!
# If your project is PowerBuy.Api, this must be PowerBuy.Api.dll
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]
