# Use STABLE .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Use the exact paths that worked in your "10.0" attempt
COPY ["Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/Powerbuy.Api/"]
RUN dotnet restore "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj"

COPY . .
WORKDIR "/src/Powerbuy.Api/Powerbuy.Api"
RUN dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

# Use STABLE .NET 8 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy the build output
COPY --from=build /app/publish .

# Standard Render port setup
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# This MUST match the actual name of your compiled DLL
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]