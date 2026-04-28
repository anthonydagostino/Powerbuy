# Use the STABLE .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Keep your working paths
COPY ["Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/Powerbuy.Api/"]
RUN dotnet restore "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj"

COPY . .
WORKDIR "/src/Powerbuy.Api/Powerbuy.Api"
RUN dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

# Use the STABLE .NET 8 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Clean up: You shouldn't need the manual apt-get install on .NET 8
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]