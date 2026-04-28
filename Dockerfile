# Use stable .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything
COPY . .

# 2. DEBUG: Print every single file Docker copied into the container
RUN echo "=== PRINTING ALL COPIED FILES ===" && ls -laR

# 3. DEBUG: Search for the csproj. If it doesn't exist, crash and print an error.
RUN find . -name "*.csproj" | grep "csproj" || (echo "❌ ERROR: No .csproj file was found inside the Docker container!" && exit 1)

# 4. Publish (will only run if the file is found)
RUN find . -name "*.csproj" -exec dotnet publish {} -c Release -o /app/publish \;

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]
