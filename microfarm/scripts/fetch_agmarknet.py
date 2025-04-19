import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select

def fetch_agmarknet_prices(output_path="../data/agmarknet_prices.csv"):
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode for performance
    driver = webdriver.Chrome(options=chrome_options)

    # Open the URL
    url = "https://agmarknet.gov.in/SearchCmmMkt.aspx"
    driver.get(url)

    # Wait for State dropdown to load
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.ID, "ddlState"))
    )

    # Get all available states
    state_dropdown = Select(driver.find_element(By.ID, "ddlState"))
    all_states = [option.text.strip() for option in state_dropdown.options]
    print("Available states:", all_states)

    # Select State (Maharashtra)
    state = "Maharashtra"
    matched_state = None
    for option in state_dropdown.options:
        if option.text.strip().lower() == state.lower():
            matched_state = option
            break
    
    if matched_state:
        state_dropdown.select_by_visible_text(matched_state.text.strip())
    else:
        print(f"Could not find state: {state}")
        driver.quit()
        return

    # Wait for District dropdown to load after selecting the state
    time.sleep(2)  # Allow time for district options to load
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.ID, "ddlDistrict"))
    )

    # Get all available districts
    district_dropdown = Select(driver.find_element(By.ID, "ddlDistrict"))
    all_districts = [option.text.strip() for option in district_dropdown.options]
    print("Available districts:", all_districts)

    # Select District (Kolhapur)
    district = "Kolhapur"
    if district in all_districts:
        district_dropdown.select_by_visible_text(district)
    else:
        print(f"Could not find district: {district}")
        driver.quit()
        return

    # Wait for Market dropdown to load
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.ID, "ddlMarket"))
    )

    # Function to fetch and refresh market names
    def get_market_names():
        try:
            # Re-fetch market names after selecting district
            WebDriverWait(driver, 30).until(
                EC.presence_of_all_elements_located((By.XPATH, '//*[@id="ddlMarket"]/option'))
            )
            markets = driver.find_elements(By.XPATH, '//*[@id="ddlMarket"]/option')[1:]  # Skip "Select"
            return [m.text for m in markets]
        except Exception as e:
            print(f"Error fetching market names: {e}")
            return []

    # Fetch market names
    market_names = get_market_names()
    print("Available markets:", market_names)

    # If markets are available, proceed with the data fetching process
    if market_names:
        results = []
        for market in market_names:
            # Select Market
            market_dropdown = Select(driver.find_element(By.ID, "ddlMarket"))
            market_dropdown.select_by_visible_text(market)

            # Wait for Commodity dropdown to load
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.ID, "ddlCommodity"))
            )

            # List of crops to select (example, adjust as needed)
            crops = ['Cotton', 'Soybean', 'Rice']  # Adjust crops as per requirement

            for crop in crops:
                # Select Crop
                commodity_dropdown = Select(driver.find_element(By.ID, "ddlCommodity"))
                commodity_dropdown.select_by_visible_text(crop)

                # Select last 30 days for date range
                date_dropdown_from = Select(driver.find_element(By.ID, "ddlFromDate"))
                date_dropdown_to = Select(driver.find_element(By.ID, "ddlToDate"))
                date_dropdown_from.select_by_index(1)  # Select from date
                date_dropdown_to.select_by_index(2)  # Select to date

                # Click the search button
                driver.find_element(By.ID, "btnGo").click()

                # Wait for the table to load
                WebDriverWait(driver, 30).until(
                    EC.presence_of_element_located((By.XPATH, "//table[@id='cphBody_GridPriceData']"))
                )

                # Extract price data
                try:
                    rows = driver.find_elements(By.XPATH, "//table[@id='cphBody_GridPriceData']//tr")[1:]  # Skip header
                    for row in rows:
                        cols = row.find_elements(By.TAG_NAME, "td")
                        if len(cols) >= 6:
                            results.append({
                                "Date": cols[0].text.strip(),
                                "District": district,
                                "Market": market,
                                "Crop": crop,
                                "MinPrice": cols[3].text.strip(),
                                "MaxPrice": cols[4].text.strip(),
                                "ModalPrice": cols[5].text.strip()
                            })
                        else:
                            print("Skipping row with insufficient data")
                except Exception as e:
                    print(f"Error extracting data: {e}")
                    pass

                # Go back to previous page to select another crop/market
                driver.back()

                # Wait for the page to load after going back
                WebDriverWait(driver, 30).until(
                    EC.presence_of_element_located((By.ID, "ddlState"))
                )

        # Save results to CSV
        if results:
            df = pd.DataFrame(results)
            df.to_csv(output_path, index=False)
            print(f"Saved {len(df)} rows to {output_path}")
        else:
            print("No data fetched.")

    driver.quit()

if __name__ == "__main__":
    fetch_agmarknet_prices()
