FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .

# THIS LINE IS KEY: It will print your folder structure to the Render Logs
RUN find . -maxdepth 4 -name "*.csproj"

# We use a wild-card restore so it finds the file regardless of the path
RUN dotnet restore $(find . -name "*.csproj" -print -quit)
RUN dotnet publish $(find . -name "*.csproj" -print -quit) -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Powerbuy.Api.dll"]