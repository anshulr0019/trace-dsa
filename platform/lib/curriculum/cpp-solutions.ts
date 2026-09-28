import {cppAdvanced} from "./cpp-advanced";
// Each body is compiled as a real C++ solve(json) function, not interpreted Python.
const bodies:Record<string,string>={
"longest-unique-substring":`string s=d["s"]; map<char,int> last; int left=0,best=0;
for(int right=0;right<s.size();right++) {
    if(last.count(s[right])) left=max(left,last[s[right]]+1);
    last[s[right]]=right; best=max(best,right-left+1);
    TRACE({{"s",s},{"left",left},{"right",right},{"best",best}});
}
return best;`,
"character-replacement":`string s=d["s"]; int k=d["k"],left=0,most=0,best=0; map<char,int> counts;
for(int right=0;right<s.size();right++) {
    most=max(most,++counts[s[right]]);
    while(right-left+1-most>k) --counts[s[left++]];
    best=max(best,right-left+1); TRACE({{"s",s},{"left",left},{"right",right},{"best",best}});
}
return best;`,
"minimum-window":`string s=d["s"],t=d["t"]; if(t.empty()) return "";
map<char,int> need; for(char c:t) need[c]++; int missing=t.size(),left=0,start=0,best=INT_MAX;
for(int right=0;right<s.size();right++) {
    if(need[s[right]]-->0) missing--;
    while(!missing) { if(right-left+1<best) {best=right-left+1;start=left;} if(++need[s[left++]]>0) missing++; }
    TRACE({{"s",s},{"left",left},{"right",right},{"missing",missing},{"best",best}});
}
return best==INT_MAX?"":s.substr(start,best);`,
"three-sum":`vector<int> nums=d["nums"]; sort(nums.begin(),nums.end()); json result=json::array();
for(int i=0;i<int(nums.size())-2;i++) {
    if(i&&nums[i]==nums[i-1]) continue; int left=i+1,right=nums.size()-1;
    while(left<right) { long long total=0LL+nums[i]+nums[left]+nums[right]; TRACE({{"nums",nums},{"i",i},{"left",left},{"right",right},{"result",result}});
        if(total<0) left++; else if(total>0) right--; else {result.push_back({nums[i],nums[left],nums[right]}); int a=nums[left],b=nums[right]; while(left<right&&nums[left]==a)left++; while(left<right&&nums[right]==b)right--;}
    }
} return result;`,
"container-water":`vector<int> height=d["height"]; int left=0,right=int(height.size())-1,best=0;
while(left<right) {best=max(best,(right-left)*min(height[left],height[right])); TRACE({{"height",height},{"left",left},{"right",right},{"best",best}}); if(height[left]<height[right])left++;else right--;}
return best;`,
"trapping-rain":`vector<int> height=d["height"]; int left=0,right=int(height.size())-1,lmax=0,rmax=0,water=0;
while(left<=right) { if(lmax<=rmax){lmax=max(lmax,height[left]);water+=lmax-height[left++];}else{rmax=max(rmax,height[right]);water+=rmax-height[right--];} TRACE({{"height",height},{"left",left},{"right",right},{"water",water},{"lmax",lmax},{"rmax",rmax}}); }
return water;`,
"middle-list":`vector<int> nodes=d["values"],links=make_links(nodes.size()); int slow=nodes.empty()?-1:0,fast=slow;
while(fast!=-1&&links[fast]!=-1){slow=links[slow];fast=links[links[fast]];TRACE({{"nodes",nodes},{"links",links},{"slow",slow},{"fast",fast}});}
TRACE({{"nodes",nodes},{"links",links},{"slow",slow}}); return walk(nodes,links,slow);`,
"linked-cycle":`vector<int> nodes=d["values"],links=make_links(nodes.size(),d.value("pos",-1));int slow=nodes.empty()?-1:0,fast=slow;
while(fast!=-1&&links[fast]!=-1){slow=links[slow];fast=links[links[fast]];TRACE({{"nodes",nodes},{"links",links},{"slow",slow},{"fast",fast}});if(slow==fast)return true;} return false;`,
"cycle-entrance":`vector<int> nodes=d["values"],links=make_links(nodes.size(),d.value("pos",-1));int slow=nodes.empty()?-1:0,fast=slow;
while(fast!=-1&&links[fast]!=-1){slow=links[slow];fast=links[links[fast]];TRACE({{"nodes",nodes},{"links",links},{"slow",slow},{"fast",fast}});if(slow==fast){slow=0;while(slow!=fast){slow=links[slow];fast=links[fast];TRACE({{"nodes",nodes},{"links",links},{"slow",slow},{"fast",fast}});}return slow;}}return -1;`,
"duplicate-number":`vector<int> nums=d["nums"];int slow=0,fast=0;
do{slow=nums.at(slow);fast=nums.at(nums.at(fast));TRACE({{"nums",nums},{"slow",slow},{"fast",fast}});}while(slow!=fast);
slow=0;while(slow!=fast){slow=nums.at(slow);fast=nums.at(fast);TRACE({{"nums",nums},{"slow",slow},{"fast",fast}});}return slow;`,
"next-greater":`vector<int> nums=d["nums2"],stack;map<int,int> next;json result=json::array();
for(int i=0;i<nums.size();i++){while(!stack.empty()&&stack.back()<nums[i]){next[stack.back()]=nums[i];stack.pop_back();}stack.push_back(nums[i]);TRACE({{"nums",nums},{"stack",stack},{"i",i}});}
for(int v:d["nums1"])result.push_back(next.count(v)?next[v]:-1);return result;`,
"daily-temperatures":`vector<int> temperatures=d["temperatures"],stack,result(temperatures.size());
for(int i=0;i<temperatures.size();i++){while(!stack.empty()&&temperatures[i]>temperatures[stack.back()]){int j=stack.back();stack.pop_back();result[j]=i-j;}stack.push_back(i);TRACE({{"temperatures",temperatures},{"stack",stack},{"result",result},{"i",i}});}return result;`,
"car-fleet":`vector<pair<int,int>> cars;int target=d["target"];for(int i=0;i<d["position"].size();i++)cars.push_back({d["position"][i],d["speed"][i]});sort(cars.rbegin(),cars.rend());vector<double> stack;
for(auto [position,speed]:cars){double arrival=double(target-position)/speed;if(stack.empty()||arrival>stack.back())stack.push_back(arrival);TRACE({{"stack",stack},{"position",position},{"arrival",arrival}});}return stack.size();`,
"largest-rectangle":`vector<int> heights=d["heights"],stack;heights.push_back(0);int best=0;
for(int i=0;i<heights.size();i++){while(!stack.empty()&&heights[stack.back()]>heights[i]){int h=heights[stack.back()];stack.pop_back();int left=stack.empty()?-1:stack.back();best=max(best,h*(i-left-1));TRACE({{"heights",heights},{"stack",stack},{"i",i},{"left",left},{"best",best}});}stack.push_back(i);}return best;`,
"valid-parentheses":`string s=d["s"];vector<string> stack;map<char,char> pairs={{')','('},{']','['},{'}','{'}};
for(int i=0;i<s.size();i++){char c=s[i];if(pairs.count(c)){if(stack.empty()||stack.back()[0]!=pairs[c])return false;stack.pop_back();}else stack.push_back(string(1,c));TRACE({{"s",s},{"stack",stack},{"i",i}});}return stack.empty();`,
"reverse-polish":`vector<long long> stack;for(string token:d["tokens"]){if(token=="+"||token=="-"||token=="*"||token=="/"){if(stack.size()<2)throw runtime_error("Missing operand");auto b=stack.back();stack.pop_back();auto a=stack.back();stack.pop_back();if(token=="/"&&!b)throw runtime_error("Division by zero");stack.push_back(token=="+"?a+b:token=="-"?a-b:token=="*"?a*b:a/b);}else stack.push_back(stoll(token));TRACE({{"stack",stack},{"token",token}});}return stack.at(0);`,
"min-stack":`vector<int> stack,minima;json result=json::array();for(auto op:d["operations"]){string name=op[0];if(name=="push"){int v=op[1];stack.push_back(v);minima.push_back(minima.empty()?v:min(v,minima.back()));result.push_back(nullptr);}else{if(stack.empty())throw runtime_error("Empty stack");if(name=="pop"){stack.pop_back();minima.pop_back();result.push_back(nullptr);}else result.push_back(name=="top"?stack.back():minima.back());}TRACE({{"stack",stack},{"minima",minima},{"result",result}});}return result;`,
"calculator-ii":`string s=d["s"];s+="+";vector<long long> stack;long long value=0;char operation='+';
for(int i=0;i<s.size();i++){char c=s[i];if(isdigit(c))value=value*10+c-'0';else if(c!=' '){if(operation=='+')stack.push_back(value);else if(operation=='-')stack.push_back(-value);else if(operation=='*')stack.back()*=value;else {if(!value)throw runtime_error("Division by zero");stack.back()/=value;}operation=c;value=0;TRACE({{"s",s},{"stack",stack},{"i",i}});}}return accumulate(stack.begin(),stack.end(),0LL);`,
"merge-intervals":`vector<vector<int>> intervals=d["intervals"],result;sort(intervals.begin(),intervals.end());for(auto interval:intervals){if(result.empty()||interval[0]>result.back()[1])result.push_back(interval);else result.back()[1]=max(result.back()[1],interval[1]);TRACE({{"intervals",intervals},{"result",result}});}return result;`,
"insert-interval":`vector<vector<int>> intervals=d["intervals"],result;vector<int> added=d["newInterval"];int i=0;
while(i<intervals.size()&&intervals[i][1]<added[0])result.push_back(intervals[i++]);
while(i<intervals.size()&&intervals[i][0]<=added[1]){added[0]=min(added[0],intervals[i][0]);added[1]=max(added[1],intervals[i++][1]);TRACE({{"intervals",intervals},{"result",result},{"added",added},{"i",i}});}result.push_back(added);while(i<intervals.size())result.push_back(intervals[i++]);TRACE({{"result",result}});return result;`,
"meeting-rooms":`vector<pair<int,int>> events;for(auto interval:d["intervals"]){events.push_back({interval[0],1});events.push_back({interval[1],-1});}sort(events.begin(),events.end());int rooms=0,best=0;for(auto [time,delta]:events){rooms+=delta;best=max(best,rooms);TRACE({{"time",time},{"rooms",rooms},{"best",best}});}return best;`,
"burst-balloons-arrows":`vector<vector<int>> intervals=d["points"];sort(intervals.begin(),intervals.end(),[](auto a,auto b){return a[1]<b[1];});int arrows=0;long long boundary=LLONG_MIN;for(auto v:intervals){if(v[0]>boundary){arrows++;boundary=v[1];}TRACE({{"intervals",intervals},{"boundary",boundary},{"arrows",arrows}});}return arrows;`,
"reverse-list":`vector<int> nodes=d["values"],links=make_links(nodes.size());int previous=-1,current=nodes.empty()?-1:0;while(current!=-1){int following=links[current];links[current]=previous;previous=current;current=following;TRACE({{"nodes",nodes},{"links",links},{"previous",previous},{"current",current},{"following",following}});}return walk(nodes,links,previous);`,
"reorder-list":`vector<int> nodes=d["values"],links=make_links(nodes.size());if(nodes.empty())return json::array();int slow=0,fast=0;
while(links[fast]!=-1&&links[links[fast]]!=-1){slow=links[slow];fast=links[links[fast]];}
int current=links[slow],previous=-1;links[slow]=-1;
while(current!=-1){int following=links[current];links[current]=previous;previous=current;current=following;TRACE({{"nodes",nodes},{"links",links},{"previous",previous},{"current",current}});}
int first=0,second=previous;while(second!=-1){int a=links[first],b=links[second];links[first]=second;links[second]=a;TRACE({{"nodes",nodes},{"links",links},{"current",first}});first=a;second=b;}return walk(nodes,links,0);`,
"copy-random-list":`vector<int> nodes=d["values"];json copies=json::array();for(int i=0;i<nodes.size();i++){copies.push_back({nodes[i],d["random"][i]});TRACE({{"nodes",nodes},{"current",i},{"copies",copies}});}return copies;`,
"reverse-k-group":`vector<int> nodes=d["values"],links=make_links(nodes.size());int k=d["k"];if(k<1)throw runtime_error("k must be positive");int head=nodes.empty()?-1:0,tail=-1,current=head;
while(current!=-1){int end=current;for(int i=1;i<k&&end!=-1;i++)end=links[end];if(end==-1)break;int following=links[end],previous=following,start=current;while(current!=following){int next=links[current];links[current]=previous;previous=current;current=next;TRACE({{"nodes",nodes},{"links",links},{"current",current},{"previous",previous}});}if(tail==-1)head=end;else links[tail]=end;tail=start;TRACE({{"nodes",nodes},{"links",links},{"head",head},{"tail",tail}});}return walk(nodes,links,head);`,
"search-matrix":`vector<vector<int>> matrix=d["matrix"];if(matrix.empty()||matrix[0].empty())return false;int cols=matrix[0].size(),left=0,right=matrix.size()*cols-1,target=d["target"];
while(left<=right){int mid=(left+right)/2,row=mid/cols,col=mid%cols;TRACE({{"matrix",matrix},{"row",row},{"col",col},{"left",left},{"right",right}});if(matrix[row][col]==target)return true;if(matrix[row][col]<target)left=mid+1;else right=mid-1;}return false;`,
"koko-bananas":`vector<int> nums=d["piles"];int hours=d["h"],left=1,right=*max_element(nums.begin(),nums.end());while(left<right){int mid=left+(right-left)/2;long long needed=0;for(int v:nums)needed+=(v+0LL+mid-1)/mid;TRACE({{"nums",nums},{"left",left},{"right",right},{"mid",mid},{"needed",needed}});if(needed<=hours)right=mid;else left=mid+1;}return left;`,
"median-sorted-arrays":`vector<int> a=d["nums1"],b=d["nums2"];if(a.size()>b.size())swap(a,b);if(b.empty())throw runtime_error("Both arrays empty");int left=0,right=a.size(),half=(a.size()+b.size()+1)/2;
while(left<=right){int i=(left+right)/2,j=half-i;double al=i?a[i-1]:-INFINITY,ar=i<a.size()?a[i]:INFINITY,bl=j?b[j-1]:-INFINITY,br=j<b.size()?b[j]:INFINITY;TRACE({{"a",a},{"b",b},{"i",i},{"j",j}});if(al<=br&&bl<=ar)return (a.size()+b.size())%2?max(al,bl):(max(al,bl)+min(ar,br))/2;if(al>br)right=i-1;else left=i+1;}throw runtime_error("Inputs must be sorted");`,
"minimum-rotated":`vector<int> nums=d["nums"];int left=0,right=nums.size()-1;while(left<right){int mid=(left+right)/2;TRACE({{"nums",nums},{"left",left},{"right",right},{"mid",mid}});if(nums[mid]>nums[right])left=mid+1;else right=mid;}return nums.at(left);`,
"search-rotated":`vector<int> nums=d["nums"];int target=d["target"],left=0,right=int(nums.size())-1;while(left<=right){int mid=(left+right)/2;TRACE({{"nums",nums},{"left",left},{"right",right},{"mid",mid}});if(nums[mid]==target)return mid;if(nums[left]<=nums[mid]){if(nums[left]<=target&&target<nums[mid])right=mid-1;else left=mid+1;}else{if(nums[mid]<target&&target<=nums[right])left=mid+1;else right=mid-1;}}return -1;`,
"search-rotated-duplicates":`vector<int> nums=d["nums"];int target=d["target"],left=0,right=int(nums.size())-1;while(left<=right){int mid=(left+right)/2;TRACE({{"nums",nums},{"left",left},{"right",right},{"mid",mid}});if(nums[mid]==target)return true;if(nums[left]==nums[mid]&&nums[mid]==nums[right]){left++;right--;}else if(nums[left]<=nums[mid]){if(nums[left]<=target&&target<nums[mid])right=mid-1;else left=mid+1;}else{if(nums[mid]<target&&target<=nums[right])left=mid+1;else right=mid-1;}}return false;`,
"mountain-array":`vector<int> nums=d["nums"];int target=d["target"],left=0,right=nums.size()-1;while(left<right){int mid=(left+right)/2;TRACE({{"nums",nums},{"left",left},{"right",right},{"mid",mid}});if(nums[mid]<nums[mid+1])left=mid+1;else right=mid;}int peak=left;
for(int side=0;side<2;side++){left=side?peak+1:0;right=side?int(nums.size())-1:peak;while(left<=right){int mid=(left+right)/2;TRACE({{"nums",nums},{"left",left},{"right",right},{"mid",mid},{"peak",peak}});if(nums[mid]==target)return mid;if((nums[mid]<target)^bool(side))left=mid+1;else right=mid-1;}}return -1;`,
"level-order":`auto [nodes,left_child,right_child]=make_tree(d["tree"]);deque<int> queue;if(!nodes.empty())queue.push_back(0);json result=json::array();while(!queue.empty()){vector<int> level;int count=queue.size();while(count--){int current=queue.front();queue.pop_front();level.push_back(nodes[current]);for(int child:{left_child[current],right_child[current]})if(child!=-1)queue.push_back(child);TRACE({{"nodes",nodes},{"left_child",left_child},{"right_child",right_child},{"queue",queue},{"current",current}});}result.push_back(level);}return result;`,
"right-side-view":`auto [nodes,left_child,right_child]=make_tree(d["tree"]);deque<int> queue;if(!nodes.empty())queue.push_back(0);vector<int> result;while(!queue.empty()){int count=queue.size(),current=-1;while(count--){current=queue.front();queue.pop_front();for(int child:{left_child[current],right_child[current]})if(child!=-1)queue.push_back(child);TRACE({{"nodes",nodes},{"left_child",left_child},{"right_child",right_child},{"queue",queue},{"current",current}});}result.push_back(nodes[current]);}return result;`,
"next-right-pointers":`auto [nodes,left_child,right_child]=make_tree(d["tree"]);deque<int> queue;if(!nodes.empty())queue.push_back(0);vector<int> links(nodes.size(),-1);while(!queue.empty()){int count=queue.size(),previous=-1;while(count--){int current=queue.front();queue.pop_front();if(previous!=-1)links[previous]=current;previous=current;for(int child:{left_child[current],right_child[current]})if(child!=-1)queue.push_back(child);TRACE({{"nodes",nodes},{"left_child",left_child},{"right_child",right_child},{"links",links},{"current",current}});}}json result=json::array();for(int i=0;i<nodes.size();i++)result.push_back({nodes[i],links[i]==-1?json(nullptr):json(nodes[links[i]])});return result;`,
"word-ladder":`string begin=d["beginWord"],end=d["endWord"];set<string> words;for(string w:d["wordList"])words.insert(w);if(!words.count(end))return 0;deque<pair<string,int>> queue={{begin,1}};set<string> visited={begin};json edges=json::array();while(!queue.empty()){auto [current,distance]=queue.front();queue.pop_front();TRACE({{"edges",edges},{"current",current},{"queue",queue},{"visited",visited}});if(current==end)return distance;for(string word:words){int diff=0;for(int i=0;i<current.size()&&i<word.size();i++)diff+=current[i]!=word[i];if(word.size()==current.size()&&diff==1&&!visited.count(word)){visited.insert(word);edges.push_back({current,word});queue.push_back({word,distance+1});}}}return 0;`,
"maximum-depth":`auto [nodes,left_child,right_child]=make_tree(d["tree"]);function<int(int)> visit=[&](int current){if(current==-1)return 0;int a=visit(left_child[current]),b=visit(right_child[current]);TRACE({{"nodes",nodes},{"left_child",left_child},{"right_child",right_child},{"current",current},{"depth",1+max(a,b)}});return 1+max(a,b);};return visit(nodes.empty()?-1:0);`,
"lowest-common-ancestor":`auto [nodes,left_child,right_child]=make_tree(d["tree"]);int p=d["p"],q=d["q"];function<int(int)> visit=[&](int current){if(current==-1)return -1;TRACE({{"nodes",nodes},{"left_child",left_child},{"right_child",right_child},{"current",current}});if(nodes[current]==p||nodes[current]==q)return current;int a=visit(left_child[current]),b=visit(right_child[current]);return a!=-1&&b!=-1?current:a!=-1?a:b;};int answer=visit(nodes.empty()?-1:0);return answer==-1?json(nullptr):json(nodes[answer]);`,
"tree-diameter":`auto [nodes,left_child,right_child]=make_tree(d["tree"]);int best=0;function<int(int)> visit=[&](int current){if(current==-1)return 0;int a=visit(left_child[current]),b=visit(right_child[current]);best=max(best,a+b);TRACE({{"nodes",nodes},{"left_child",left_child},{"right_child",right_child},{"current",current},{"best",best}});return 1+max(a,b);};visit(nodes.empty()?-1:0);return best;`,
"maximum-path-sum":`auto [nodes,left_child,right_child]=make_tree(d["tree"]);if(nodes.empty())return 0;int best=INT_MIN;function<int(int)> gain=[&](int current){if(current==-1)return 0;int a=max(0,gain(left_child[current])),b=max(0,gain(right_child[current]));best=max(best,nodes[current]+a+b);TRACE({{"nodes",nodes},{"left_child",left_child},{"right_child",right_child},{"current",current},{"best",best}});return nodes[current]+max(a,b);};gain(0);return best;`,
"implement-trie":`json trie=json::object(),result=json::array();for(auto op:d["operations"]){string name=op[0],word=op[1];json* node=&trie;bool found=true;for(char c:word){string key(1,c);if(name=="insert"&&!node->contains(key))(*node)[key]=json::object();if(!node->contains(key)){found=false;break;}node=&(*node)[key];}if(name=="insert"){(*node)["$"]=true;result.push_back(nullptr);}else result.push_back(found&&(name=="startsWith"||node->contains("$")));TRACE({{"trie",trie},{"result",result},{"word",word}});}return result;`,
"word-dictionary":`json trie=json::object(),result=json::array();function<bool(const json&,const string&,int)> search=[&](const json& node,const string& word,int i){if(i==word.size())return node.contains("$");if(word[i]=='.'){for(auto it=node.begin();it!=node.end();++it)if(it.key()!="$"&&search(it.value(),word,i+1))return true;return false;}string key(1,word[i]);return node.contains(key)&&search(node[key],word,i+1);};for(auto op:d["operations"]){string word=op[1];if(op[0]=="addWord"){json* node=&trie;for(char c:word){string key(1,c);if(!node->contains(key))(*node)[key]=json::object();node=&(*node)[key];}(*node)["$"]=true;result.push_back(nullptr);}else result.push_back(search(trie,word,0));TRACE({{"trie",trie},{"word",word},{"result",result}});}return result;`,
"replace-words":`json trie=json::object();for(string root:d["dictionary"]){json* node=&trie;for(char c:root){string key(1,c);if(!node->contains(key))(*node)[key]=json::object();node=&(*node)[key];}(*node)["$"]=true;}istringstream stream(d["sentence"].get<string>());string word,result;while(stream>>word){json* node=&trie;string prefix;for(char c:word){string key(1,c);if(node->contains("$")||!node->contains(key))break;prefix+=c;node=&(*node)[key];}if(!result.empty())result+=" ";result+=node->contains("$")?prefix:word;TRACE({{"trie",trie},{"word",word},{"result",result}});}return result;`,
"word-search-ii":`vector<vector<string>> grid=d["board"];json trie=json::object();for(string word:d["words"]){json* node=&trie;for(char c:word){string key(1,c);if(!node->contains(key))(*node)[key]=json::object();node=&(*node)[key];}(*node)["$"]=word;}set<string> found;int rows=grid.size(),cols=rows?grid[0].size():0;function<void(int,int,json&)> visit=[&](int row,int col,json& node){if(row<0||col<0||row>=rows||col>=cols)return;string ch=grid[row][col];if(!node.contains(ch))return;json& next=node[ch];if(next.contains("$"))found.insert(next["$"]);grid[row][col]="#";TRACE({{"grid",grid},{"row",row},{"col",col},{"found",found}});visit(row+1,col,next);visit(row-1,col,next);visit(row,col+1,next);visit(row,col-1,next);grid[row][col]=ch;};for(int r=0;r<rows;r++)for(int c=0;c<cols;c++)visit(r,c,trie);return found;`,
"missing-number":`vector<int> nums=d["nums"];for(int i=0;i<nums.size();i++){while(nums[i]>=0&&nums[i]<nums.size()&&nums[i]!=i){int j=nums[i];if(nums[j]==nums[i])break;swap(nums[i],nums[j]);TRACE({{"nums",nums},{"i",i},{"j",j}});}}for(int i=0;i<nums.size();i++)if(nums[i]!=i)return i;return nums.size();`,
"disappeared-numbers":`vector<int> nums=d["nums"],result;for(int i=0;i<nums.size();i++){while(nums[i]>=1&&nums[i]<=nums.size()&&nums[nums[i]-1]!=nums[i]){int j=nums[i]-1;swap(nums[i],nums[j]);TRACE({{"nums",nums},{"i",i},{"j",j}});}}for(int i=0;i<nums.size();i++)if(nums[i]!=i+1)result.push_back(i+1);return result;`,
"set-mismatch":`vector<int> nums=d["nums"];for(int i=0;i<nums.size();i++){TRACE({{"nums",nums},{"i",i}});while(nums.at(nums[i]-1)!=nums[i]){int j=nums[i]-1;swap(nums[i],nums[j]);TRACE({{"nums",nums},{"i",i},{"j",j}});}}for(int i=0;i<nums.size();i++)if(nums[i]!=i+1)return json::array({nums[i],i+1});return json::array();`,
"first-missing-positive":`vector<int> nums=d["nums"];for(int i=0;i<nums.size();i++){while(nums[i]>0&&nums[i]<=nums.size()&&nums[nums[i]-1]!=nums[i]){int j=nums[i]-1;swap(nums[i],nums[j]);TRACE({{"nums",nums},{"i",i},{"j",j}});}}for(int i=0;i<nums.size();i++)if(nums[i]!=i+1)return i+1;return nums.size()+1;`,
};
export const cppHelpers=`#include "trace.hpp"
#include <cmath>
#include <tuple>
// Linked structures use node indices so every pointer is inspectable.
vector<int> make_links(int n, int pos=-1) {
    vector<int> links(n); for(int i=0;i<n;i++) links[i]=i+1<n?i+1:pos;
    return links;
}
json walk(const vector<int>& nodes, const vector<int>& links, int head) {
    json result=json::array(); set<int> seen;
    while(head!=-1&&seen.insert(head).second) { result.push_back(nodes.at(head)); head=links.at(head); }
    return result;
}
tuple<vector<int>,vector<int>,vector<int>> make_tree(json values) {
    vector<int> nodes,left,right;
    if(values.empty()||values[0].is_null()) return {nodes,left,right};
    nodes.push_back(values[0]);left.push_back(-1);right.push_back(-1);
    deque<int> queue={0};int index=1;
    while(!queue.empty()&&index<values.size()) {
        int parent=queue.front();queue.pop_front();
        for(int side=0;side<2&&index<values.size();side++,index++) if(!values[index].is_null()) {
            (side?right:left)[parent]=nodes.size();queue.push_back(nodes.size());
            nodes.push_back(values[index]);left.push_back(-1);right.push_back(-1);
        }
    }
    return {nodes,left,right};
}
`;
function support(body:string){
 let prefix='#include "trace.hpp"\n#include <cmath>\n#include <tuple>\n';
 if(body.includes("make_links("))prefix+=cppHelpers.slice(cppHelpers.indexOf("// Linked"),cppHelpers.indexOf("json walk"));
 if(body.includes("walk("))prefix+=cppHelpers.slice(cppHelpers.indexOf("json walk"),cppHelpers.indexOf("tuple<vector"));
 if(body.includes("make_tree("))prefix+=cppHelpers.slice(cppHelpers.indexOf("tuple<vector"));
 return prefix;
}
export const cppSolutions:Record<string,string>=Object.fromEntries(Object.entries({...bodies,...cppAdvanced}).map(([id,body])=>[id,support(body)+"\njson solve(json d) {\n"+body.split("\n").map(line=>"    "+line).join("\n")+"\n}\n"]));
