# Makefile for C++ benchmark
CXX = g++
CXXFLAGS = -std=c++17 -O3 -Wall
TARGET = benchmark
SOURCE = benchmark.cpp

$(TARGET): $(SOURCE)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCE)

clean:
	del $(TARGET).exe

.PHONY: clean