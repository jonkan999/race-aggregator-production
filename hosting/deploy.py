import os

def deploy(country_code):
    """Verify build exists for deployment"""
    if not os.path.exists(f"build/{country_code}"):
        print(f"No build directory found for {country_code}")
        return
    
    print(f"Build directory verified for {country_code}")

def main():
    # Deploy each country
    countries = ["se"]  # Add your country codes
    for country in countries:
        deploy(country)

if __name__ == "__main__":
    main()