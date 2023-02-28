import re
import datetime, time

#Esta clase sirve para parsear timestamps, recibe 2 y hace la diferencia
class Tiempo:
    def __init__ (self, inicio, final = -1, seconds = -1): #Necesario para tener 2 constructores
        self.positivo = True
        if final == -1: #Primer constructor (1 argumento)

            self.hours = 0
            self.minutes = 0
            self.seconds = 0

            erHours = re.compile(r'\d*h')
            erMinutes = re.compile(r'\d*m')
            erSeconds = re.compile(r'\d*s')
            h = erHours.search(inicio)
            m = erMinutes.search(inicio)
            s = erSeconds.search(inicio)

            if h != None:
                self.hours = h[0][:-1]
            if m != None:
                self.minutes = m[0][:-1]
            if s != None:
                self.seconds = s[0][:-1]
                
            self.hours = int(self.hours)
            self.minutes = int(self.minutes)
            self.seconds = int(self.seconds)
                
            if self.seconds >= 60:
                self.minutes += int(self.seconds/60)
                self.seconds = self.seconds%60
            if self.minutes >= 60:
                self.hours += int(self.minutes/60)
                self.minutes = self.minutes%60
            
        elif seconds == -1: #Segundo constructor (2 aregumentos)
            self.hours = 0
            self.minutes = 0
            self.seconds = 0

            fin = time.mktime(datetime.datetime.strptime(final, "%Y-%m-%dT%H:%M:%S.%fZ").timetuple())
            ini = time.mktime(datetime.datetime.strptime(inicio, "%Y-%m-%dT%H:%M:%S.%fZ").timetuple())

            hoursRaw = int((fin - ini)/3600)
            minutesRaw = int((fin - ini)/60)
            secondsRaw = int(fin - ini)

            if hoursRaw != 0:
                self.hours = hoursRaw
                minutesRaw = int(((fin - ini)%3600)/60)
            if minutesRaw != 0:
                self.minutes = minutesRaw
                secondsRaw = int((fin - ini)%60)
            self.seconds = secondsRaw
            
        else: #Tercer constructor (3 argumentos)
            self.hours = inicio
            self.minutes = final
            self.seconds = seconds
            
        self.hours = int(self.hours)
        self.minutes = int(self.minutes)
        self.seconds = int(self.seconds)
            
    def toString(self):
        return self.__repr__()
    
    def __int__ (self):
        return self.hours*3600 + self.minutes*60 + self.seconds

    def __repr__(self):
        t=""
        if self.hours !=0:
            t += str(self.hours) + "h/"
        if self.minutes !=0:
            t += str(self.minutes) + "m/"
        if self.seconds !=0:
            t += str(self.seconds) + "s"
        else:
            t = t[:-1]
        if self.hours == 0 and self.minutes == 0 and self.seconds == 0:
            return "0s"
        return t
    
    def __add__(self, t): #Sobrecarga del operador +
        s = self.seconds + t.seconds
        m = int(self.minutes) + t.minutes
        h = self.hours + t.hours
        
        if s >= 60:
            s -= 60
            m += 1
        if m >= 60:
            m -= 60
            h += 1
            
        return Tiempo(h,m,s)
    
    def __sub__(self, t):
        sSelf = self.hours*3600 + self.minutes*60 + self.seconds
        sT = t.hours*3600 + t.minutes*60 + t.seconds
        
        return Tiempo(str(sSelf-sT) + "s")
    
    def __mul__(self, n): #Sobrecarga del operador *
        s = self.seconds * n
        m = self.minutes * n
        h = self.hours * n

        m += (h - int(h))*60
        s += (m - int(m))*60

        if s >= 60:
            m += int(s/60)
            s = s%60
        if m >= 60:
            h += int(m/60)
            m = m%60
            
        return Tiempo(h,m,s)
    
    def __truediv__(self, n): #Sobrecarga del operador /
        selfS = self.seconds
        selfM = self.minutes
        selfH = self.hours
        
        h = int(selfH/n)
        selfM += (selfH%n)*60
        m = int(selfM/n)
        selfS += (selfM%n)*60
        s = int(selfS/n)
        
        if s >= 60:
            m += int(s/60)
            s = s%60
        if m >= 60:
            h += int(m/60)
            m = m%60
        return Tiempo(int(h),int(m),int(s))
    
    def __abs__(self):
        return Tiempo(abs(self.hours), abs(self.minutes), abs(self.seconds))
    
    def __le__(self, t):   #Sobrecarga del operado <=  
        sSelf = self.hours*3600 + self.minutes*60 + self.seconds
        if type(t) == Tiempo:
            sT = t.hours*3600 + t.minutes*60 + t.seconds
        else:
            sT = t       
        return sSelf <= sT
    
    def __ge__(self, t):  #Sobrecarga del operado >=
        sSelf = self.hours*3600 + self.minutes*60 + self.seconds
        if type(t) == Tiempo:
            sT = t.hours*3600 + t.minutes*60 + t.seconds
        else:
            sT = t      
        return sSelf >= sT
    
    def __lt__(self, t):     #Sobrecarga del operado <
        sSelf = self.hours*3600 + self.minutes*60 + self.seconds
        if type(t) == Tiempo:
            sT = t.hours*3600 + t.minutes*60 + t.seconds
        else:
            sT = t        
        return sSelf < sT
    
    def __gt__(self, t):   #Sobrecarga del operado >
        sSelf = self.hours*3600 + self.minutes*60 + self.seconds
        if type(t) == Tiempo:
            sT = t.hours*3600 + t.minutes*60 + t.seconds
        else:
            sT = t
        return sSelf > sT