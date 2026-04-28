FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything
COPY . .

# 1. DEBUG: List all files and folders to the Render logs
# This will show us EXACTLY where your project file is.
RUN echo "--- DIRECTORY STRUCTURE ---" && ls -R && echo "--------------------------"

# 2. Use a Case-Insensitive find to locate and copy the file
RUN find . -iname "Powerbuy.Api.csproj" -exec cp {} . \;

# 3. Build and Publish
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]