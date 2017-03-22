# -*- coding: utf-8 -*-
"""
Created on Wed Apr 20 21:00:30 2016

@author: Saptashwa
"""

import matplotlib.pyplot as plt

# Collect the data from the file, ignore empty lines
fo = open("data.txt", "r+")

line = fo.readline()


lines = line.split("$$")

lineFinal = lines[1]
scores = lineFinal.split(' ')
#print(scores)


plt.figure(figsize=(8,5))
plt.plot(scores)
plt.xlabel('No. of Games Played')
plt.ylabel('Score')

plt.show()

fo.close()
