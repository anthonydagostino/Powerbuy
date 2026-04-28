# Use .NET 8 (Standard Stable version)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy the entire repository
COPY . .

# 2. MOVE the "working room" to exactly where your project file is
# Based on your GitHub link, this is the path
WORKDIR "/src/Powerbuy.Api/Powerbuy.Api"

# 3. Now that we are IN the folder, we don't need paths. 
# We just say "restore" and "publish"
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# This runs your app
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]