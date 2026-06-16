"""
Biometric Vault Storage Overhead Analysis
=========================================
This script calculates the effective storage blowup when using Shamir's 
Secret Sharing (SSS) with threshold (t, n) parameters, adjusting for 
data deduplication strategies (e.g., via CDStore architecture).

It compares the proposed approach against naive Shamir distribution
and Fully Homomorphic Encryption (FHE) baselines.
"""

# Shamir (t=3, n=5) storage overhead
n, t = 5, 3
naive_blowup = n / t
print(f"Naive Shamir blowup (n={n}, t={t}): {naive_blowup:.2f}x")

# After 25% deduplication (from CDStore paper)
dedup_rate = 0.25
effective = naive_blowup * (1 - dedup_rate)
print(f"After {dedup_rate:.0%} deduplication: {effective:.2f}x")

# Compare
print(f"\nCentralized:   1.00x")
print(f"Proposed:      {effective:.2f}x")
print(f"Naive Shamir:  {naive_blowup:.2f}x")
print(f"FHE typical:   ~22x")
