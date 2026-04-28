# Use stable .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies first.
# This step is cached by Docker and only re-runs if the project files change.
COPY ["Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/"]
COPY ["Powerbuy.Web/Powerbuy.Web.csproj", "Powerbuy.Web/"]

# It's also good practice to copy the solution file if you have one, e.g.:
# COPY YourSolution.sln .

RUN dotnet restore "Powerbuy.Api/Powerbuy.Api.csproj"

# Now, copy the rest of the application's code
COPY . .

# Publish the application (using --no-restore because we already restored)
RUN dotnet publish "Powerbuy.Api/Powerbuy.Api.csproj" -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]
