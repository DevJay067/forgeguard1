"""
Shamir's Secret Sharing (SSS) Core Simulation
=============================================
A pure-Python implementation of Shamir's Secret Sharing using a 256-bit prime field.
This is used to demonstrate the splitting of high-entropy biometric keys (post-fusion)
into 'n' shares, requiring 't' shares for reconstruction via Lagrange interpolation.
Includes performance benchmarking for share generation and reconstruction.
"""
import time, os

PRIME = 2**256 - 189

def extended_gcd(a, b):
    if a == 0: return b, 0, 1
    g, x, y = extended_gcd(b % a, a)
    return g, y - (b // a) * x, x

def modinv(a, m):
    g, x, _ = extended_gcd(a, m)
    return x % m

def shamir_share(secret, t, n, prime=PRIME):
    coeffs = [secret] + [
        int.from_bytes(os.urandom(32), 'big') % prime
        for _ in range(t-1)
    ]
    return [(i, sum(coeffs[j]*pow(i,j,prime)
             for j in range(t)) % prime)
            for i in range(1, n+1)]

def shamir_reconstruct(shares, prime=PRIME):
    secret = 0
    for i, (xi, yi) in enumerate(shares):
        num, den = yi, 1
        for j, (xj, _) in enumerate(shares):
            if i != j:
                num = (num * (-xj)) % prime
                den = (den * (xi - xj)) % prime
        secret = (secret + num * modinv(den, prime)) % prime
    return secret

secret = int.from_bytes(os.urandom(32), 'big') % PRIME
RUNS = 500

t0 = time.perf_counter()
for _ in range(RUNS):
    shares = shamir_share(secret, 3, 5)
t1 = time.perf_counter()
share_ms = (t1-t0)/RUNS*1000

t0 = time.perf_counter()
for _ in range(RUNS):
    recovered = shamir_reconstruct(shares[:3])
t1 = time.perf_counter()
recon_ms = (t1-t0)/RUNS*1000

assert recovered == secret, "ERROR: reconstruction failed!"
print(f"Share generation  (t=3, n=5): {share_ms:.4f} ms")
print(f"Lagrange reconstruction:      {recon_ms:.4f} ms")
print(f"Secret verified correct:      YES")
