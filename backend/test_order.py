import os, sys, json, urllib.request

def run_test():
    try:
        # Login
        url_login = "http://localhost:8000/auth/login"
        data_login = json.dumps({"email": "mje@campusflow.com", "password": "password"}).encode('utf-8')
        req_login = urllib.request.Request(url_login, data=data_login, headers={"Content-Type": "application/json"})
        res_login = urllib.request.urlopen(req_login)
        token = json.loads(res_login.read())["access_token"]
        print("Logged in successfully.")
        
        # Get canteens
        url_canteens = "http://localhost:8000/canteens"
        req_canteens = urllib.request.Request(url_canteens, headers={"Authorization": f"Bearer {token}"})
        canteens = json.loads(urllib.request.urlopen(req_canteens).read())
        if not canteens:
            print("No canteens found.")
            return
        
        vendor_id = None
        menu_item_id = None
        
        for c in canteens:
            vid = c["vendor_id"]
            url_menu = f"http://localhost:8000/canteens/{vid}/menu"
            req_menu = urllib.request.Request(url_menu, headers={"Authorization": f"Bearer {token}"})
            menu = json.loads(urllib.request.urlopen(req_menu).read())
            if menu:
                vendor_id = vid
                menu_item_id = menu[0]["id"]
                break
                
        if not vendor_id:
            print("No menu items found across any canteen.")
            return
            
        print(f"Vendor selected: {vendor_id}")
        print(f"Menu item selected: {menu_item_id}")
        
        # Place order
        url_orders = "http://localhost:8000/orders"
        order_payload = {
            "vendor_id": vendor_id,
            "items": [
                {
                    "menu_item_id": menu_item_id,
                    "quantity": 1.0
                }
            ]
        }
        data_orders = json.dumps(order_payload).encode('utf-8')
        print("Sending order payload:", json.dumps(order_payload))
        
        req_orders = urllib.request.Request(url_orders, data=data_orders, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        res_orders = urllib.request.urlopen(req_orders)
        print("Order Success:", json.loads(res_orders.read()))
        
    except urllib.error.HTTPError as e:
        print(f"HTTP ERROR {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run_test()
