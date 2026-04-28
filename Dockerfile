# Use .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything from the repo
COPY . .

# 1. Find the folder containing the .csproj
# 2. Change directory to that folder
# 3. Publish the project
RUN PROJ_PATH=$(find . -name "Powerbuy.Api.csproj" -print -quit) && \
    PROJ_DIR=$(dirname "$PROJ_PATH") && \
    cd "$PROJ_DIR" && \
    dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render needs to know which port to listen on
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]