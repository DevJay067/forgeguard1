"""
SHA-3 Benchmark for Biometric Vault
===================================
Benchmarking script to evaluate the performance of SHA-3 256
hashing on 1KB data chunks, simulating the overhead of integrity 
verification for fragmented biometric shares.
"""
import time, os, hashlib

RUNS = 1000
data = os.urandom(1024)  # 1KB chunk

t0 = time.perf_counter()
for _ in range(RUNS):
    hashlib.sha3_256(data).digest()
t1 = time.perf_counter()

print(f"SHA-3-256 (1KB): {(t1-t0)/RUNS*1000:.4f} ms per hash")
