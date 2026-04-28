# Use stable .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything
COPY . .

# 2. Find the project file, print it, and run publish (failing if publish fails)
RUN PROJECT_FILE=$(find . -name "*.csproj" | head -n 1) && \
    echo "========================================" && \
    echo "🏗️ FOUND PROJECT FILE: $PROJECT_FILE" && \
    echo "========================================" && \
    dotnet publish "$PROJECT_FILE" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]
