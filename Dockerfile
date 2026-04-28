# Use Stable .NET 8
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Copy everything in the repo
COPY . .

# 2. Automatically find the .csproj file no matter where it is
# then restore and publish it to /app/publish
RUN PROJECT_FILE=$(find . -name "Powerbuy.Api.csproj" -print -quit) && \
    dotnet publish "$PROJECT_FILE" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render defaults
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# This must match your output DLL name
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]