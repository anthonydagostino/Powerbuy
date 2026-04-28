FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything
COPY . .

# 2. Find the project file and copy it directly to /src
# This solves the "path not found" issue permanently
RUN find . -name "*.csproj" -exec cp {} . \;

# 3. Build from the current directory (no paths needed)
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Note: Ensure Powerbuy.Api.dll is the correct name of your output
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]