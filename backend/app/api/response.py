class API:
    @staticmethod
    def success(message: str):
        return {"message": message}

    @staticmethod
    def success_with_data(message: str, key: str, value):
        payload = API.success(message)
        payload[key] = value
        return payload
