# Use the stable .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the csproj and restore (Adjust the path if your folder name is different!)
COPY ["Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/"]
RUN dotnet restore "Powerbuy.Api/Powerbuy.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/Powerbuy.Api"
RUN dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

# Use the stable .NET 8 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy the published files from the build stage
COPY --from=build /app/publish .

# Render uses the PORT environment variable; 8080 is a good default
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Double-check that your output DLL is actually named exactly this
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]