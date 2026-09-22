"""Small, dependency-light statistics (numpy only) so the method is easy to read."""
import numpy as np


def rankdata(a):
    """Average ranks (1-based), ties get the mean rank."""
    a = np.asarray(a, float)
    order = np.argsort(a, kind="mergesort")
    ranks = np.empty(len(a), float)
    ranks[order] = np.arange(1, len(a) + 1)
    _, inv, counts = np.unique(a, return_inverse=True, return_counts=True)
    sums = np.bincount(inv, weights=ranks)
    return (sums / counts)[inv]


def spearman(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if len(x) < 3 or np.all(x == x[0]) or np.all(y == y[0]):
        return float("nan")
    return float(np.corrcoef(rankdata(x), rankdata(y))[0, 1])


def auroc(score, label):
    """Mann-Whitney AUROC; nan if only one class present."""
    score, label = np.asarray(score, float), np.asarray(label, bool)
    npos, nneg = label.sum(), (~label).sum()
    if npos == 0 or nneg == 0:
        return float("nan")
    r = rankdata(score)
    return float((r[label].sum() - npos * (npos + 1) / 2) / (npos * nneg))


def fit_logistic(X, y, l2=1.0, iters=100):
    """L2-penalised logistic regression by Newton-Raphson (intercept not penalised)."""
    X1 = np.column_stack([np.ones(len(X)), X])
    w = np.zeros(X1.shape[1])
    P = np.eye(X1.shape[1]) * l2
    P[0, 0] = 0.0
    for _ in range(iters):
        p = 1 / (1 + np.exp(-X1 @ w))
        g = X1.T @ (p - y) + P @ w
        H = X1.T @ (X1 * (p * (1 - p))[:, None]) + P
        step = np.linalg.solve(H, g)
        w -= step
        if np.max(np.abs(step)) < 1e-9:
            break
    return w[0], w[1:]
