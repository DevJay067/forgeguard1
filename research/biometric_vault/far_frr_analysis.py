"""
False Acceptance Rate (FAR) / False Rejection Rate (FRR) Analysis
===================================================================
Simulates genuine and impostor biometric score distributions based on 
FVC2004 / CASIA benchmark patterns. Calculates the Equal Error Rate (EER) 
and plots the FAR/FRR curve for the decentralized biometric threshold.
"""
import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)

# Score distributions consistent with FVC2004 / CASIA benchmarks
genuine_scores  = np.random.normal(0.78, 0.07, 1000).clip(0,1)
impostor_scores = np.random.normal(0.38, 0.09, 5000).clip(0,1)

thresholds = np.arange(0.30, 0.95, 0.01)
far_list, frr_list = [], []

for tau in thresholds:
    far_list.append(np.mean(impostor_scores >= tau))
    frr_list.append(np.mean(genuine_scores  <  tau))

far = np.array(far_list)
frr = np.array(frr_list)

# EER
eer_idx = np.argmin(np.abs(far - frr))
eer = (far[eer_idx] + frr[eer_idx]) / 2

# At tau = 0.60
idx60 = np.argmin(np.abs(thresholds - 0.60))
acc60 = 1 - (far[idx60]*5000 + frr[idx60]*1000) / 6000

print(f"EER:          {eer:.2%}")
print(f"FAR @ 0.60:   {far[idx60]:.2%}")
print(f"FRR @ 0.60:   {frr[idx60]:.2%}")
print(f"Accuracy:     {acc60:.2%}")

# Plot
plt.figure(figsize=(8,5))
plt.plot(thresholds, far*100, label='FAR', color='orange', lw=2)
plt.plot(thresholds, frr*100, label='FRR', color='teal',   lw=2)
plt.axvline(0.60, color='blue', linestyle='--', label='τ=0.60')
plt.xlabel('Threshold'); plt.ylabel('Error Rate (%)')
plt.title('FAR / FRR vs Authentication Threshold')
plt.legend(); plt.grid(alpha=0.3)
plt.savefig('far_frr_curve.png', dpi=150)
plt.show()
print("Chart saved as far_frr_curve.png")