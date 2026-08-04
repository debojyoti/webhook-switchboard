import type { Route } from "../../../contract/api.contract.js";
import type { Environment } from "../../config/env.js";
import { EncryptionHelper } from "../../infra/encryption/encryption.helper.js";
import { HeaderSecurityHelper } from "../../infra/security/header-security.helper.js";
import type { RouteDocument } from "./route.model.js";

export const RoutePresenter = {
  present(document: RouteDocument, environment: Environment): Route {
    return {
      id: document._id.toHexString(),
      endpointId: document.endpointId.toHexString(),
      url: document.url,
      enabled: document.enabled,
      customHeaders: document.customHeaders.map((header) => {
        const isMasked = HeaderSecurityHelper.isSensitive(header.name);
        return {
          name: header.name,
          value: isMasked ? "[redacted]" : EncryptionHelper.decrypt(header.valueEncrypted, environment.APP_ENCRYPTION_KEY),
          isMasked,
        };
      }),
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  },
};
