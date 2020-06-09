import os
import json
import numpy as np
import requests
from bs4 import BeautifulSoup
from github import Github
from time import gmtime,strftime

#get the data
URL = 'https://www.worldometers.info/coronavirus/'
page = requests.get(URL)

soup = BeautifulSoup(page.content, 'html.parser')

#find the data at the correct Div tag
results = soup.find(id='main_table_countries_today')

# find the right location in the table to start processing data
all_results = results.find_all('td')
all_results = [str(c) for c in all_results]
case_start_index = -1
case_end_index = -1
start = 0
end = 0
while case_start_index < 0:
    for text in all_results:
        if "All" in text:
            case_start_index = start
            break
        else:
            start += 1

while case_end_index < 0:
    for text in all_results:
        if 'strong' in text:
            case_end_index = end
            break
        else:
            end += 1

#create lists to contain data from table
all_results = all_results[case_start_index + 1: case_end_index]
rank = []
countries = []
total_cases = []
new_cases = []
total_deaths = []
new_deaths = []
total_recovered = []
new_recovered = []
active_cases = []
critical_cases = []
cases_1m = []
deaths_1m = []
total_tests = []
tests_1m = []
population = []
continent = []
cases_x_ppl = []
deaths_x_ppl = []
tests_x_ppl = []

#formatting out some extraneous data
all_results = [str(c)[:-5] for c in all_results]

all_results = [c[c.index('>') + 1:] for c in all_results]

all_results = all_results[3:]

#pushes data to list
def append_data(adding_list, k, num_list=[]):
    val_list = all_results[k] if num_list == [] else num_list
    temp_string = [n for n in val_list if n.isdigit()]
    if temp_string:
        adding_list.append(''.join(temp_string))
    else:
        adding_list.append("NULL")

#iterates through all lines frm table, formats strings correctly and adds them to list
for i in range(len(all_results)):

    if i % 19 == 0:
        rank.append(all_results[i])

    elif (i - 1) % 19 == 0:
        temp_str = all_results[i][all_results[i].index('>') + 1:]
        temp_str = temp_str[:temp_str.index('<')]
        countries.append(temp_str.strip(' '))

    elif (i - 2) % 19 == 0:
        append_data(total_cases, i)

    elif (i - 3) % 19 == 0:
        append_data(new_cases, i)

    elif (i - 4) % 19 == 0:
        append_data(total_deaths, i)

    elif (i - 5) % 19 == 0:
        append_data(new_deaths, i)

    elif (i - 6) % 19 == 0:
        append_data(total_recovered, i)

    elif (i - 7) % 19 == 0:
        append_data(new_recovered, i)

    elif (i - 8) % 19 == 0:
        append_data(active_cases, i)

    elif (i - 9) % 19 == 0:
        append_data(critical_cases, i)

    elif (i - 10) % 19 == 0:
        append_data(cases_1m, i)

    elif (i - 11) % 19 == 0:
        append_data(deaths_1m, i)

    elif (i - 12) % 19 == 0:
        append_data(total_tests, i)

    elif (i - 13) % 19 == 0:
        append_data(tests_1m, i)

    elif (i - 14) % 19 == 0:
        if '>' in all_results[i]:
            temp_str = all_results[i][all_results[i].index('>') + 1:]
            temp_str = temp_str[:temp_str.index('<')]
        elif temp_str == "China":
            temp_str = all_results[i].strip()
        append_data(population, i, temp_str)

    elif (i - 15) % 19 == 0:
        continent.append(all_results[i])

    elif (i - 16) % 19 == 0:
        append_data(cases_x_ppl, i)

    elif (i - 17) % 19 == 0:
        append_data(deaths_x_ppl, i)

    elif (i - 18) % 19 == 0:
        append_data(tests_x_ppl, i)



#fixing a few naming anomalies

countries = ['Central African Republic' if c == 'CAR' else c for c in countries]
countries = ['South Korea' if c == 'S. Korea' else c for c in countries]
countries = ['St. Vincent and the Grenadines' if c == 'St. Vincent Grenadines' else c for c in countries]
countries = ['The Bahamas' if c == 'Bahamas' else c for c in countries]
countries = ['Saint Barthelemy' if c == 'St. Barth' else c for c in countries]
countries = ['United States' if c == 'USA' else c for c in countries]
countries = ['Curacao' if c == 'Curaçao' else c for c in countries]
countries = ['United Kingdom' if c == 'UK' else c for c in countries]
countries = ['United Arab Emirates' if c == 'UAE' else c for c in countries]
countries = ['Saint Pierre and Miquelon' if c == 'Saint Pierre Miquelon' else c for c in countries]
continent = ['Oceania' if c == 'Australia/Oceania' else c for c in continent]

#China is listed last, this puts its data in the correct order
china_cases = int(total_cases[-1])
before_val = 0
for case in total_cases:
    if int(case) > china_cases:
        before_val += 1
    else:
        break

del rank[-1]
china_rank = before_val + 1
rank = [str(int(r) + 1) if int(r) >= china_rank else r for r in rank]
del rank[-1]
rank.append(str(china_rank))

#create 1 master 2D matrix to hold all of the data
all_data = np.zeros(shape=(len(countries), 19)).tolist()


def _2d_matrix_vals(col, lst):
    for i in range(len(countries)):
        if lst[i].isnumeric():
            all_data[i][col] = int(lst[i])
        else:
            all_data[i][col] = lst[i]


_2d_matrix_vals(0, rank)
_2d_matrix_vals(1, countries)
_2d_matrix_vals(2, total_cases)
_2d_matrix_vals(3, new_cases)
_2d_matrix_vals(4, total_deaths)
_2d_matrix_vals(5, new_deaths)
_2d_matrix_vals(6, total_recovered)
_2d_matrix_vals(7, new_recovered)
_2d_matrix_vals(8, active_cases)
_2d_matrix_vals(9, critical_cases)
_2d_matrix_vals(10, cases_1m)
_2d_matrix_vals(11, deaths_1m)
_2d_matrix_vals(12, total_tests)
_2d_matrix_vals(13, tests_1m)
_2d_matrix_vals(14, population)
_2d_matrix_vals(15, continent)
_2d_matrix_vals(16, cases_x_ppl)
_2d_matrix_vals(17, deaths_x_ppl)
_2d_matrix_vals(18, tests_x_ppl)

#all data from the 2D matrix above will then be pushed to a GeoJSON file, which is later used in the web app


#delete any old existing geojson file from server
if os.path.exists('map_data.geojson'):
    os.remove("map_data.geojson")

#get the newest map data from github (download locally)
geojson_url = 'https://raw.githubusercontent.com/jerguy1928/covid_visual/master/map_data.geojson'
r = requests.get(geojson_url, allow_redirects=True)
open("map_data.geojson", 'wb').write(r.content)


#remove the var countries = , so it is possible to read JSON data
# var countries is prepended in Geojson so data can be read
with open('map_data.geojson', 'r') as original:
    data = original.read()

if data[0] == 'v':
    with open('map_data.geojson', 'w') as modified:
        modified.write(data[16:])

# process the newly downloaded geojson file
jsonFile = open("map_data.geojson", "r")  # Open the JSON file for reading
data = json.load(jsonFile)  # Read the JSON into the buffer
jsonFile.close()  # Close the JSON file


case_length = len(all_data)
# function pushes all the new data from the 2D matrix into the Geojson
def correct_country(current,ind,data):
    data_OK = False
    for j in range(len(data['features'])):
        if data['features'][j]['properties']['name'] == current:
            data['features'][j]['properties']['rank'] = all_data[ind][0]
            data['features'][j]['properties']['total_cases'] = all_data[ind][2]
            data['features'][j]['properties']['new_cases'] = all_data[ind][3]
            data['features'][j]['properties']['total_deaths'] = all_data[ind][4]
            data['features'][j]['properties']['new_deaths'] = all_data[ind][5]
            data['features'][j]['properties']['total_recovered'] = all_data[ind][6]
            data['features'][j]['properties']['new_recovered'] = all_data[ind][7]
            data['features'][j]['properties']['active_cases'] = all_data[ind][8]
            data['features'][j]['properties']['critical_cases'] = all_data[ind][9]
            data['features'][j]['properties']['cases_1m'] = all_data[ind][10]
            data['features'][j]['properties']['deaths_1m'] = all_data[ind][11]
            data['features'][j]['properties']['total_tests'] = all_data[ind][12]
            data['features'][j]['properties']['tests_1m'] = all_data[ind][13]
            data['features'][j]['properties']['population'] = all_data[ind][14]
            data['features'][j]['properties']['continent'] = all_data[ind][15]
            data['features'][j]['properties']['cases_x_ppl'] = all_data[ind][16]
            data['features'][j]['properties']['deaths_x_ppl'] = all_data[ind][17]
            data['features'][j]['properties']['tests_x_ppl'] = all_data[ind][18]
            data_OK = True
    if not data_OK:
        raise ValueError(f'Couldnt find val for {current}')


for i in range(len(all_data)):
    correct_country(all_data[i][1], i, data)

#write the newly scraped data into the geojson file (update values)
jsonFile = open("map_data.geojson", "w")
jsonFile.write(json.dumps(data))
jsonFile.close()

# add var countries = , back into data
with open('map_data.geojson', 'r') as original:
    data = original.read()

with open('map_data.geojson', 'w') as modified:
    modified.write('var countries = ' + data)

# read the newly updated file
with open('map_data.geojson', 'r') as original:
    final_data = original.read()


#Push the newly update geojson file to Github
g = Github("my username", "my password") # real username and password removed from here for security reasons
repo = g.get_repo("jerguy1928/covid_visual")
contents = repo.get_contents("map_data.geojson")
repo.update_file(contents.path,f'Updated {strftime("%a, %d %b %Y %H:%M",gmtime())} UTC', final_data, contents.sha, branch='master')





