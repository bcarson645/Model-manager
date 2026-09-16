# -*- coding: utf-8 -*-
import importlib.util
from pathlib import Path

path = Path(__file__).with_name("sim_one_ball_compare.py")
spec = importlib.util.spec_from_file_location("sim", path)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

over = 10
base = m.make_base_for_over(over)
atlas_pre = m.renorm(m.carve_extras(base, m.atlas_extras_mult(over)))
auto = m.apply_auto_sim_multipliers(m.carve_extras(base, m.csharp_extras_mult(over)))
ea, eb = m.expected_runs(atlas_pre), m.expected_runs(auto)
print(f"Same base Factor1=1 vs Auto: delta={eb-ea:+.4f}/ball, {(eb-ea)*120:+.2f}/innings")
for boost in (0.0, 0.02, 0.0333, 0.05):
    target = m.expected_runs(atlas_pre) + boost
    atlas_hot = m.atlas_factor1_rebalance(atlas_pre, target, 0.17)
    d = m.expected_runs(auto) - m.expected_runs(atlas_hot)
    print(f"  Atlas +{boost:.4f} RPB target: Auto-Atlas={d:+.4f}/ball ({d*120:+.1f}/inn)")
for k in (1.0, 0.97, 0.95, 0.93):
    cold = dict(base)
    for key in ("1", "2", "3", "4", "6"):
        cold[key] *= k
    s = sum(cold.values())
    if s < 1:
        cold["0"] += 1 - s
    cold = m.renorm(cold)
    a = m.renorm(m.carve_extras(base, m.atlas_extras_mult(over)))
    b = m.apply_auto_sim_multipliers(m.carve_extras(cold, m.csharp_extras_mult(over)))
    d = m.expected_runs(b) - m.expected_runs(a)
    print(f"  Auto base scale k={k:.2f}: delta={d:+.4f}/ball ({d*120:+.1f}/inn)")
