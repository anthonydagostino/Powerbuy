# Use .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the entire repository first
COPY . .

# Move specifically into the folder containing your .csproj
# Based on your path: Powerbuy/Powerbuy.Api/Powerbuy.Api/
WORKDIR "/src/Powerbuy/Powerbuy.Api/Powerbuy.Api"

# Restore dependencies for this specific project
RUN dotnet restore "Powerbuy.Api.csproj"

# Publish the project
RUN dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render requirements
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]