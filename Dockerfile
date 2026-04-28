# Use .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything
COPY . .

# 2. Find the project file and move it to the current directory
# This eliminates all pathing issues
RUN find . -name "Powerbuy.Api.csproj" -exec cp {} . \;

# 3. Restore and Publish from the current flat directory
RUN dotnet restore "Powerbuy.Api.csproj"
RUN dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]