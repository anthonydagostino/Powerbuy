FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# 1. Copy the entire repo into the container
COPY . .

# 2. List the files so we can see them in the logs (for debugging)
RUN ls -R

# 3. Try to restore using the FULL path from the root
# Note: No variables, no find command. Just the hard path.
RUN dotnet restore "Powerbuy/Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj"

# 4. Build and Publish
RUN dotnet publish "Powerbuy/Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj" -c Release -o out

# 5. Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]