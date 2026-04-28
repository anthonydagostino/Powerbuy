FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj", "Powerbuy.Api/Powerbuy.Api/"]
RUN dotnet restore "Powerbuy.Api/Powerbuy.Api/Powerbuy.Api.csproj"

COPY . .
WORKDIR "/src/Powerbuy.Api/Powerbuy.Api"
RUN dotnet publish "Powerbuy.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080