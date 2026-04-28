# 1. Build stage using .NET 10 SDK
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only the project file and restore dependencies (Optimized for caching)
COPY ["Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/Powerbuy.Api/"]
RUN dotnet restore "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj"

# Copy the rest of the code and publish
COPY . .
RUN dotnet publish "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj" -c Release -o /app/publish --no-restore

# 2. Runtime stage using .NET 10 ASP.NET
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Install the missing Kerberos library for Npgsql (PostgreSQL) to prevent crashes
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

# Copy the built application
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]
