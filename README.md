# dataerror

A lightweight, opinionated TypeScript error-handling library that brings structure and consistency to every async function return in your codebase.

## Why dataerror?

Most TypeScript projects suffer from inconsistent error handling. Some functions throw, some return `null`, some resolve with partial data, and catch blocks pass around untyped `unknown` values that nobody inspects. Debugging becomes a scavenger hunt.

**dataerror** fixes this by introducing a single, predictable return shape for every operation:

```ts
{ data: T | null, error: ErrorType | null }
```

If the operation succeeds, `data` is populated and `error` is `null`. If it fails, `data` is `null` and `error` is a fully-typed object with `code`, `message`, `details`, and `hint`. No exceptions to learn, no ambiguity — just data or an error, every time.

The library also ships a curated dictionary of common application errors (invalid credentials, missing inputs, database failures, etc.) so your team doesn't have to reinvent error definitions across services.

Larger error-handling libraries have a learning curve.  **dataerror** is simple and minimal - two functions, a return type, an error type, and an extendable dictionary of common errors - so you can jump in immediately.

---

## Installation

```bash
npm install dataerror
```

---

## Quick Start

```ts
import { success, failure, errors } from 'dataerror';
import type { DataErrorReturnObject } from 'dataerror';

type User = { id: number; name: string };

async function getUser(id: number): Promise<DataErrorReturnObject<User>> {
  try {
    const user = await db.findUser(id);
    if (!user) {
      return await failure<User>(errors.userNotFound, 'getUser');
    }
    return await success<User>(user);
  } catch (error) {
    return await failure<User>(error, 'getUser');
  }
}

// Consuming the result is straightforward:
const result = await getUser(42);

if (result.error) {
  console.log(result.error.code);    // "user_not_found"
  console.log(result.error.hint);    // "Check that the user has signed up"
} else {
  console.log(result.data.name);     // "Alice"
}
```

For consuming a function that you know already follows the dataerror pattern:

```ts
const getCities = (): DataErrorReturnObject<City[]> => {
  try {
    const citiesResponse: DataErrorReturnObject<City[]> = await getCitiesFromAPI();
    
	if (citiesResponse.error) {
	  return await failure<City[]>(citiesResponse.error, 'apiCalls/getCities');
	}
	
	return await success<City[]>(citiesResponse.data);
  } catch (error) {
    // it is still good practice to include a catch block in case an error is thrown for some reason
	return await failure<City[]>()
  }
}
````

---

## Types

### `ErrorType`

The core error shape used throughout the library. Every error — whether predefined or formatted from an unknown value — conforms to this structure.

```ts
type ErrorType = {
  code: string;     // A machine-readable snake_case identifier (e.g. "user_not_found")
  message: string;  // A short, human-readable title (e.g. "User not found")
  details: string;  // A longer explanation of what went wrong
  hint: string;     // Actionable guidance for the developer or end user
}
```

**Design rationale:** Four fields strike a balance between being useful for logging dashboards and error-handling consumption by frontends (`code`), user-facing UI (`message`), developer debugging (`details`), and actionable recovery (`hint`).

---

### `DataErrorReturnObject<T>`

The universal return type for any function that can succeed or fail. It is generic over `T`, the type of the data payload on success.

```ts
type DataErrorReturnObject<T> = {
  data: T | null;
  error: ErrorType | null;
}
```

In practice, exactly one of `data` or `error` will be non-null:

| Outcome | `data`   | `error`    |
|---------|----------|------------|
| Success | `T`      | `null`     |
| Failure | `null`   | `ErrorType`|

Use this as the return type of any async function in your application layer to get consistent, type-safe results across your entire codebase.

---

### `UnformattedError`

Represents the loose shape of errors that may come from external sources (third-party APIs, database drivers, etc.) before they are normalized into an `ErrorType`.

```ts
type UnformattedError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  [key: string]: unknown;   // allows any additional properties
}
```

You do not need to construct these yourself. The library uses this type internally when it receives an `unknown` error and attempts to extract whatever fields are available.

---

### `ErrorAdditionalArgs`

An optional configuration object passed to the `failure()` function.

```ts
type ErrorAdditionalArgs = {
  returnErrorType?: ErrorType;
  logInvalidCredentialsErrors?: boolean;
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `returnErrorType` | `ErrorType` | — | Forces the returned error to be a specific `ErrorType`, regardless of what the original error looked like. Useful when you know the context (e.g. a database layer should always surface `errors.databaseError`). |
| `logInvalidCredentialsErrors` | `boolean` | `false` | By default, `invalid_credentials` errors are **not** logged to avoid flooding error logs every time a user mistypes a password. Set this to `true` if you want them logged. |

---

### `ErrorsObject`

The type describing the shape of the exported `errors` dictionary. It contains named keys for every predefined error and also includes an index signature so you can access entries dynamically by string key.

```ts
type ErrorsObject = {
  internalServerError: ErrorType;
  invalidCredentials: ErrorType;
  badOAuthCallback: ErrorType;
  userNotFound: ErrorType;
  userAlreadyExists: ErrorType;
  missingPassword: ErrorType;
  weakPassword: ErrorType;
  sessionNotFound: ErrorType;
  missingInputs: ErrorType;
  accessDenied: ErrorType;
  databaseError: ErrorType;
  cacheError: ErrorType;
  unknownError: ErrorType;
  referenceError: ErrorType;
  typeError: ErrorType;
  syntaxError: ErrorType;
  rangeError: ErrorType;
  [key: string]: ErrorType;
}
```

---

## Predefined Errors

The `errors` object is an exported dictionary containing ready-to-use `ErrorType` entries for the most common application-level failures. Use these directly instead of constructing error objects by hand.

```ts
import { errors } from 'dataerror';
```

| Key | `code` | `message` | When to use |
|-----|--------|-----------|-------------|
| `internalServerError` | `internal_server_error` | Internal Server Error | A generic catch-all for unexpected server failures. |
| `invalidCredentials` | `invalid_credentials` | Invalid login credentials | User supplied the wrong email or password. |
| `badOAuthCallback` | `bad_oauth_callback` | Bad OAuth Callback | The OAuth redirect/callback failed or returned unexpected data. |
| `userNotFound` | `user_not_found` | User not found | A lookup for a user returned no results. |
| `userAlreadyExists` | `user_already_exists` | User already registered | A sign-up attempt for an email that already has an account. |
| `missingPassword` | `missing_password` | Password required | No password was provided during a sign-up or password-change flow. |
| `weakPassword` | `weak_password` | Weak Password | The supplied password does not meet strength requirements. |
| `sessionNotFound` | `session_not_found` | Session Not Found | The session token is expired or invalid. |
| `missingInputs` | `missing_inputs` | Missing Inputs | Required parameters were not supplied to a function or endpoint. |
| `accessDenied` | `access_denied` | 401 Access Denied | The caller is not authorized to perform the requested action. |
| `databaseError` | `database_error` | Database Error | A database query or connection has failed. |
| `cacheError` | `cache_error` | Cache error | A cache read/write operation has failed. |
| `unknownError` | `unknown_error` | Custom error of unknown type | Fallback used when the original error cannot be classified. |
| `referenceError` | `reference_error` | Reference error | A JavaScript `ReferenceError` was caught (e.g. accessing an undefined variable). |
| `typeError` | `type_error` | Type error | A JavaScript `TypeError` was caught (e.g. calling a non-function). |
| `syntaxError` | `syntax_error` | Syntax error | A JavaScript `SyntaxError` was caught |
| `rangeError` | `range_error` | Range error | A JavaScript `RangeError` was caught |

Every entry in this dictionary has all four `ErrorType` fields (`code`, `message`, `details`, `hint`) fully populated with sensible defaults.

### Using predefined errors directly

You can pass any predefined error into `failure()` as the error argument, or use it as a `returnErrorType` override:

```ts
// As the error itself
return await failure<User>(errors.userNotFound, 'userService/getById');

// As a forced return type for ambiguous upstream errors
return await failure<User>(error, 'userService/getById', {
  returnErrorType: errors.databaseError
});
```

---

## Public Functions

### `success<T>(data: T)`

Wraps a successful result in the standard `DataErrorReturnObject` shape.

```ts
async function success<T>(data: T): Promise<DataErrorReturnObject<T>>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `data` | `T` | The payload to return. Can be any type: a primitive, an object, an array, or even `null`. |

**Returns:** `Promise<DataErrorReturnObject<T>>` — resolves to `{ data: T, error: null }`.

**Why is it async?** The function is async for future-proofing. A future version of the library may integrate async side effects (e.g. sending success telemetry to an observability service). Making it async from the start avoids a breaking change for consumers later.

#### Examples

```ts
// Returning a fetched object
async function getCity(id: number): Promise<DataErrorReturnObject<City>> {
  try {
    const city = await db.cities.findById(id);
    return await success<City>(city);
  } catch (error) {
    return await failure<City>(error, 'getCity');
  }
}

// Returning a primitive
return await success<number>(users.length);

// Returning an array
return await success<string[]>(tagNames);
```

---

### `failure<T>(error, location, additionalArgs?)`

Wraps a failure in the standard `DataErrorReturnObject` shape. Under the hood it normalizes the error into an `ErrorType` (filling in missing fields with defaults from `errors.unknownError`) and logs it to the console.

```ts
async function failure<T>(
  error: unknown,
  location: string,
  additionalArgs?: ErrorAdditionalArgs
): Promise<DataErrorReturnObject<T>>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `error` | `unknown` | The error to process. Can be an `ErrorType`, a native `Error`/`ReferenceError`/`TypeError`, a partial object, or any thrown value. |
| `location` | `string` | A developer-written string identifying where the error occurred (e.g. `'auth/actions/login'`). This appears in the console log for quick debugging. |
| `additionalArgs` | `ErrorAdditionalArgs` | Optional configuration — see the ErrorAdditionalArgs type above. |

**Returns:** `Promise<DataErrorReturnObject<T>>` — resolves to `{ data: null, error: ErrorType }`.

**Why is it async?** Same rationale as `success()` — future-proofing for potential async logging or telemetry integrations.

#### How errors are normalized

The `failure` function processes the incoming error through the following logic:

1. **`ReferenceError` instance** → returns `errors.referenceError`
2. **`TypeError` instance** → returns `errors.typeError`
3. **`SyntaxError` instance** → returns `errors.syntaxError`
4. **`RangeError` instance** → returns `errors.rangeError`
5. **Object with all four fields** (`code`, `message`, `details`, `hint` — all truthy) → returned as-is
6. **Partial object** → missing fields are filled from `errors.unknownError`
7. **Anything else** (string, number, etc.) → defaults to `errors.unknownError` for all fields

#### How logging works

For every call to `failure()`, a summary line is written to `console.log` and the raw error is written to `console.error`.

The summary format depends on the error:

- **Typed error** (has a `code`): `"code: message at location"`
- **Unknown error** (no `code`): first 15 characters of `JSON.stringify(error)` followed by `" at location"`

**Special case — invalid credentials:** Errors with code `invalid_credentials` are **not logged** by default. This prevents log pollution from normal failed login attempts. To enable logging for these, pass `{ logInvalidCredentialsErrors: true }` in `additionalArgs`.

#### Examples

```ts
// Basic usage in a catch block
async function fetchPosts(): Promise<DataErrorReturnObject<Post[]>> {
  try {
    const posts = await api.getPosts();
    return await success<Post[]>(posts);
  } catch (error) {
    return await failure<Post[]>(error, 'fetchPosts');
  }
}

// Basic usage when calling a function that already returns a DataErrorReturnObject
const getCities = (): DataErrorReturnObject<City[]> => {
  try {
    const citiesResponse: DataErrorReturnObject<City[]> = await getCitiesFromAPI();
    
	if (citiesResponse.error) {
	  return await failure<City[]>(citiesResponse.error, 'apiCalls/getCities');
	}
	
	return await success<City[]>(citiesResponse.data);
  } catch (error) {
    // it is still good practice to include a catch block in case an error is thrown for some reason
	return await failure<City[]>()
  }
}

// Forcing a specific error type for context
async function saveUser(user: User): Promise<DataErrorReturnObject<User>> {
  try {
    const saved = await db.users.insert(user);
    return await success<User>(saved);
  } catch (error) {
    return await failure<User>(error, 'saveUser', {
      returnErrorType: errors.databaseError
    });
  }
}

// Returning a known predefined error (no catch block needed)
async function login(email: string, password: string): Promise<DataErrorReturnObject<Session>> {
  if (!password) {
    return await failure<Session>(errors.missingPassword, 'login');
  }

  const user = await db.users.findByEmail(email);
  if (!user) {
    return await failure<Session>(errors.invalidCredentials, 'login');
  }

  // ...authenticate...
  return await success<Session>(session);
}

// Opting in to log invalid-credential errors
return await failure<Session>(errors.invalidCredentials, 'login', {
  logInvalidCredentialsErrors: true
});
```

---

## Patterns and Best Practices

### Consistent function signatures

Adopt `DataErrorReturnObject<T>` as the return type for all service-layer and API-handler functions. This gives every consumer a single pattern to learn:

```ts
const result = await doSomething();
if (result.error) {
  // handle error — result.error is fully typed
} else {
  // use result.data — it is T, not T | null
}
```

### Descriptive `location` strings

Use a path-style convention so errors are easy to trace in logs:

```ts
return await failure<User>(error, 'services/userService/createUser');
return await failure<Order>(error, 'api/orders/getById');
```

### Use `returnErrorType` to add context

When an error bubbles through a database layer, the raw error might be a cryptic driver message. Override it with something meaningful:

```ts
catch (error) {
  return await failure<Row[]>(error, 'db/query', {
    returnErrorType: errors.databaseError
  });
}
```

The original error is still logged in full, but the structured error returned to the caller is clean and actionable.

### Create custom errors for your domain

The `errors` dictionary covers common cases. For domain-specific errors, define your own `ErrorType` objects following the same shape:

```ts
const paymentDeclined: ErrorType = {
  code: 'payment_declined',
  message: 'Payment Declined',
  details: 'The payment processor declined the transaction',
  hint: 'Check the card details or try a different payment method'
};

return await failure<Invoice>(paymentDeclined, 'billing/chargeCard');
```

---

## API Reference Summary

| Export | Kind | Description |
|--------|------|-------------|
| `success<T>(data)` | Function | Wraps data in `{ data: T, error: null }` |
| `failure<T>(error, location, args?)` | Function | Wraps an error in `{ data: null, error: ErrorType }`, logs it |
| `errors` | Object | Dictionary of predefined `ErrorType` entries |
| `ErrorType` | Type | `{ code, message, details, hint }` |
| `DataErrorReturnObject<T>` | Type | `{ data: T \| null, error: ErrorType \| null }` |
| `UnformattedError` | Type | Loose error shape with optional fields |
| `ErrorAdditionalArgs` | Type | Options for `failure()`: `returnErrorType`, `logInvalidCredentialsErrors` |
| `ErrorsObject` | Type | Shape of the `errors` dictionary |
