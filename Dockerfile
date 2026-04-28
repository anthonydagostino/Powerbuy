# Use .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything from the GitHub repo into the container
COPY . .

# 2. Find the .csproj file dynamically and restore dependencies
# This command handles the Powerbuy/Powerbuy.Api/Powerbuy.Api/ nesting automatically
RUN dotnet restore $(find . -name "*.csproj" -print -quit)

# 3. Build and Publish the project to the /app/publish folder
RUN dotnet publish $(find . -name "*.csproj" -print -quit) -c Release -o /app/publish

# 4. Use .NET 8 Runtime for the final image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# 5. Copy the published files from the build stage
COPY --from=build /app/publish .

# 6. Set environment variables for Render
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# 7. Start the API (Ensure this filename matches your project name!)
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]