# Use .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy EVERYTHING from the repo to ensure we have all files
COPY . .

# 1. Find the .csproj file automatically
# 2. Store the path in a variable
# 3. Publish using that path
RUN PROJECT_FILE=$(find . -name "Powerbuy.Api.csproj" -print -quit) && \
    dotnet publish "$PROJECT_FILE" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render defaults
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]