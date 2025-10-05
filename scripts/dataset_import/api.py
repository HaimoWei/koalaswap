from __future__ import annotations

import logging
from typing import Any, Dict

import requests


class ApiClient:
    """Lightweight wrapper around KoalaSwap HTTP API."""

    def __init__(self, base_url: str, timeout: int = 15) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.logger = logging.getLogger("dataset_import")

    def register_user(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/auth/register",
            json=payload,
            timeout=self.timeout,
        )
        self._check_response(response, "register_user")
        data = self._safe_json(response)
        return data.get("data") if isinstance(data, dict) else data

    def login(self, email: str, password: str) -> str:
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": email, "password": password},
            timeout=self.timeout,
        )
        self._check_response(response, "login")
        payload = self._safe_json(response)
        data = payload.get("data") if isinstance(payload, dict) else {}
        token = data.get("accessToken") or data.get("token")
        if not token:
            raise RuntimeError("Login response missing token field")
        return token

    def create_product(self, token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{self.base_url}/api/products",
            json=payload,
            headers=headers,
            timeout=self.timeout,
        )
        self._check_response(response, "create_product")
        payload = self._safe_json(response)
        if isinstance(payload, dict):
            return payload.get("data", payload)
        return payload

    def request_image_upload(self, token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{self.base_url}/api/products/images/request-upload",
            json=payload,
            headers=headers,
            timeout=self.timeout,
        )
        self._check_response(response, "request_image_upload")
        return response.json()

    def complete_image_upload(self, token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{self.base_url}/api/products/images/upload-complete",
            json=payload,
            headers=headers,
            timeout=self.timeout,
        )
        self._check_response(response, "complete_image_upload")
        if not response.content:
            return None
        return self._safe_json(response)

    def _check_response(self, response: requests.Response, operation: str) -> None:
        if response.status_code >= 400:
            try:
                detail = response.json()
            except Exception:  # noqa: BLE001
                detail = response.text
            raise RuntimeError(f"{operation} failed: {response.status_code} {detail}")
        self.logger.info("%s succeeded: %s", operation, response.status_code)

    @staticmethod
    def _safe_json(response: requests.Response) -> Any:
        if not response.content:
            return None
        try:
            return response.json()
        except ValueError:
            return None
