<?php

// These trusted helpers are included in generated source, never executed by PHP.
return [
    'python' => <<<'PY'
import math
import re

def cl_checked(value):
    if isinstance(value, int) and not -2147483648 <= value <= 2147483647:
        raise ValueError("Integer overflow")
    if isinstance(value, float) and not math.isfinite(value):
        raise ValueError("Non-finite result")
    return value

def cl_add(a, b): return cl_checked(a + b)
def cl_sub(a, b): return cl_checked(a - b)
def cl_mul(a, b): return cl_checked(a * b)
def cl_div(a, b):
    if b == 0: raise ValueError("Division by zero")
    return cl_checked(a / b)
def cl_mod(a, b):
    if b == 0: raise ValueError("Division by zero")
    return a % abs(b)

def cl_get(a, i):
    if i < 0 or i >= len(a): raise ValueError("Array index out of bounds")
    return a[i]
def cl_set(a, i, v):
    cl_get(a, i)
    a[i] = v

def cl_read_string(prompt): return input(prompt)
def cl_read_int(prompt):
    value = input(prompt).strip()
    if not re.fullmatch(r"[+-]?[0-9]+", value): raise ValueError("Invalid integer input")
    return cl_checked(int(value))
def cl_read_real(prompt):
    value = input(prompt).strip()
    if not re.fullmatch(r"[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?", value): raise ValueError("Invalid decimal input")
    return cl_checked(float(value))
def cl_print(value):
    if not isinstance(value, float):
        print(value)
        return
    if abs(value) > 1000000000: raise ValueError("Decimal output exceeds supported magnitude 1e9")
    rounded = math.floor(abs(value) * 1000000 + 0.5)
    sign = "-" if value < 0 and rounded else ""
    print(f"{sign}{rounded // 1000000}.{rounded % 1000000:06d}")

PY,
    'cpp' => <<<'CPP'
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <regex>
#include <cmath>
#include <limits>
#include <stdexcept>
#include <type_traits>
#include <cstdlib>
using namespace std;

int cl_checked(long long v) {
    if (v < -2147483648LL || v > 2147483647LL) throw runtime_error("Integer overflow");
    return static_cast<int>(v);
}
double cl_checked(double v) {
    if (!isfinite(v)) throw runtime_error("Non-finite result");
    return v;
}
template<class A, class B> auto cl_add(A a, B b) {
    if constexpr (is_integral_v<A> && is_integral_v<B>) return cl_checked(static_cast<long long>(a) + b);
    else return cl_checked(static_cast<double>(a) + b);
}
template<class A, class B> auto cl_sub(A a, B b) {
    if constexpr (is_integral_v<A> && is_integral_v<B>) return cl_checked(static_cast<long long>(a) - b);
    else return cl_checked(static_cast<double>(a) - b);
}
template<class A, class B> auto cl_mul(A a, B b) {
    if constexpr (is_integral_v<A> && is_integral_v<B>) return cl_checked(static_cast<long long>(a) * b);
    else return cl_checked(static_cast<double>(a) * b);
}
double cl_div(double a, double b) {
    if (b == 0) throw runtime_error("Division by zero");
    return cl_checked(a / b);
}
int cl_mod(int a, int b) {
    if (b == 0) throw runtime_error("Division by zero");
    long long d = b; if (d < 0) d = -d;
    return static_cast<int>(((static_cast<long long>(a) % d) + d) % d);
}
template<class T> T cl_get(const vector<T>& a, int i) {
    if (i < 0 || static_cast<size_t>(i) >= a.size()) throw runtime_error("Array index out of bounds");
    return a.at(i);
}
template<class T, class V> void cl_set(vector<T>& a, int i, V v) {
    cl_get(a, i); a.at(i) = v;
}
string cl_read_string(const string& prompt) {
    cout << prompt;
    string line; if (!getline(cin, line)) throw runtime_error("Missing input");
    if (!line.empty() && line.back() == '\r') line.pop_back();
    return line;
}
string cl_trim(string v) {
    auto start = v.find_first_not_of(" \t\r\n");
    return start == string::npos ? "" : v.substr(start, v.find_last_not_of(" \t\r\n") - start + 1);
}
int cl_read_int(const string& prompt) {
    string v = cl_trim(cl_read_string(prompt));
    if (!regex_match(v, regex("[+-]?[0-9]+"))) throw runtime_error("Invalid integer input");
    return cl_checked(stoll(v));
}
double cl_read_real(const string& prompt) {
    string v = cl_trim(cl_read_string(prompt));
    if (!regex_match(v, regex("[+-]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)([eE][+-]?[0-9]+)?"))) throw runtime_error("Invalid decimal input");
    return cl_checked(strtod(v.c_str(), nullptr));
}
void cl_print(int v) { cout << v << endl; }
void cl_print(const string& v) { cout << v << endl; }
void cl_print(double v) {
    if (abs(v) > 1000000000) throw runtime_error("Decimal output exceeds supported magnitude 1e9");
    long long rounded = static_cast<long long>(floor(abs(v) * 1000000 + 0.5));
    cout << (v < 0 && rounded ? "-" : "") << rounded / 1000000 << '.'
         << setw(6) << setfill('0') << rounded % 1000000 << setfill(' ') << endl;
}

CPP,
    'java' => <<<'JAVA'
import java.util.Scanner;
import java.util.Locale;

public class Main {
    static final Scanner cl_input = new Scanner(System.in);
    static int cl_add(int a, int b) { return Math.addExact(a, b); }
    static int cl_sub(int a, int b) { return Math.subtractExact(a, b); }
    static int cl_mul(int a, int b) { return Math.multiplyExact(a, b); }
    static double cl_checked(double v) {
        if (!Double.isFinite(v)) throw new IllegalArgumentException("Non-finite result");
        return v;
    }
    static double cl_add(double a, double b) { return cl_checked(a + b); }
    static double cl_sub(double a, double b) { return cl_checked(a - b); }
    static double cl_mul(double a, double b) { return cl_checked(a * b); }
    static double cl_div(double a, double b) {
        if (b == 0) throw new IllegalArgumentException("Division by zero");
        return cl_checked(a / b);
    }
    static int cl_mod(int a, int b) {
        if (b == 0) throw new IllegalArgumentException("Division by zero");
        long d = Math.abs((long)b);
        return (int)(((a % d) + d) % d);
    }
    static boolean cl_eq(double a, double b) { return a == b; }
    static boolean cl_eq(boolean a, boolean b) { return a == b; }
    static boolean cl_eq(String a, String b) { return a.equals(b); }
    static void cl_bounds(int length, int i) {
        if (i < 0 || i >= length) throw new IllegalArgumentException("Array index out of bounds");
    }
    static int cl_get(int[] a, int i) { cl_bounds(a.length, i); return a[i]; }
    static double cl_get(double[] a, int i) { cl_bounds(a.length, i); return a[i]; }
    static String cl_get(String[] a, int i) { cl_bounds(a.length, i); return a[i]; }
    static void cl_set(int[] a, int i, int v) { cl_bounds(a.length, i); a[i] = v; }
    static void cl_set(double[] a, int i, double v) { cl_bounds(a.length, i); a[i] = v; }
    static void cl_set(String[] a, int i, String v) { cl_bounds(a.length, i); a[i] = v; }
    static String cl_read_string(String prompt) {
        System.out.print(prompt);
        if (!cl_input.hasNextLine()) throw new IllegalArgumentException("Missing input");
        return cl_input.nextLine();
    }
    static int cl_read_int(String prompt) {
        String v = cl_read_string(prompt).trim();
        if (!v.matches("[+-]?[0-9]+")) throw new IllegalArgumentException("Invalid integer input");
        return Integer.parseInt(v);
    }
    static double cl_read_real(String prompt) {
        String v = cl_read_string(prompt).trim();
        if (!v.matches("[+-]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)([eE][+-]?[0-9]+)?")) throw new IllegalArgumentException("Invalid decimal input");
        return cl_checked(Double.parseDouble(v));
    }
    static void cl_print(int v) { System.out.println(v); }
    static void cl_print(String v) { System.out.println(v); }
    static void cl_print(double v) {
        if (Math.abs(v) > 1000000000) throw new IllegalArgumentException("Decimal output exceeds supported magnitude 1e9");
        long rounded = (long)Math.floor(Math.abs(v) * 1000000 + 0.5);
        System.out.printf(Locale.ROOT, "%s%d.%06d%n", v < 0 && rounded != 0 ? "-" : "", rounded / 1000000, rounded % 1000000);
    }

JAVA,
];
