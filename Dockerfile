# 1. Use the .NET 10 SDK to build the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only the project file and restore dependencies (Optimized for caching)
COPY ["Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/Powerbuy.Api/"]
RUN dotnet restore "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj"

# Copy the rest of the code and publish
COPY . .
RUN dotnet publish "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj" -c Release -o /app/publish --no-restore

# 2. Use the .NET 10 ASP.NET Runtime to run the app
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]
