const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface ApiOptions extends RequestInit {
    auth?: boolean;
}

export async function apiFetch<T>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<T> {

    const {
        auth = true,
        headers,
        ...fetchOptions
    } = options;

    const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
    };

    // Copy any custom headers
    if (headers) {
        if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                requestHeaders[key] = value;
            });
        } else if (Array.isArray(headers)) {
            headers.forEach(([key, value]) => {
                requestHeaders[key] = value;
            });
        } else {
            Object.entries(headers).forEach(([key, value]) => {
                if (value !== undefined) {
                    requestHeaders[key] = value;
                }
            });
        }
    }

    // Add JWT token
    if (auth && typeof window !== "undefined") {

        const token =
            localStorage.getItem("mis_token");

        if (token) {
            requestHeaders["Authorization"] =
                `Bearer ${token}`;
        }
    }

    let requestEndpoint = endpoint;

    // SUPER_ADMIN organization context is carried by the API query string.
    // Regular users never send a client-selected organization.
    if (typeof window !== "undefined" && !endpoint.startsWith("/api/organizations")) {
        const token = localStorage.getItem("mis_token");
        const activeOrganizationId = localStorage.getItem("mis_active_organization_id");

        if (token && activeOrganizationId) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1] || ""));
                if (payload.role === "SUPER_ADMIN") {
                    const separator = requestEndpoint.includes("?") ? "&" : "?";
                    requestEndpoint += `${separator}organizationId=${encodeURIComponent(activeOrganizationId)}`;
                }
            } catch {
                // Invalid token will be handled by the API authentication layer.
            }
        }
    }

    const response = await fetch(
        `${API_URL}${requestEndpoint}`,
        {
            ...fetchOptions,
            headers: requestHeaders,
        }
    );

    if (!response.ok) {

        if (response.status === 401) {

            if (typeof window !== "undefined") {
                localStorage.removeItem("mis_token");
                window.location.href = "/login";
            }
        }

        const error = await response.json()
            .catch(() => ({}));

        throw new Error(
            error.message || "API request failed"
        );
    }

    return response.json();
}