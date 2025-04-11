# SCHOOLNEST

# testing user credentials
email: testuser@gmail.com
password: testuser

i am aware that the mongo uri was pushed to github. i did that so i dont have to keep sending people the env file. dont worry that database is seperate from the actual schoolnest database. 

# transfer protocol
we're too broke to pay for netlify starter so we have two burner accounts that we can transfer site load to
- atharun@team4099 netlify account has the burner github and netlify account
- currently, this account has the schoolcentral domain and handles the site load
- if we need to transfer the site load to the burner account, we can do so by first completely removing the schoolcentral domain from the atharun account. we need to go into ACCOUNT domain settings and delete the zone file
- then go into agneyat2@gmail.com and add the domain to the account. change the namecheap dns settings so that it points to the new netlify nameservers. then add the domain to the netlify site.

## to spin up a new deployment of schoolcentral:
- make a fork of the schoolnest repo
- create a new github account and connect it to netlify. deploy the forked repo.
- go into build settings and change it to these settings:

base directory: /
package directory: /
build command: next build
publish directory: /.next
functions directory: /netlify/functions

- go to this site and install the nextjs runtime into the netlify site. [deploy nextjs to netlify](https://www.netlify.com/blog/2020/11/30/how-to-deploy-next.js-sites-to-netlify/)
- upload the .env file to the netlify site. MAKE SURE THAT THE NEXTAUTH_URL=https://schoolnest.org
